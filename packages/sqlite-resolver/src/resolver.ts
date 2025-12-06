import { ModuleCache, type ModuleCacheOptions } from './cache';
import { resolve, dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

export interface ResolverStats {
  moduleHits: number;
  moduleMisses: number;
  metadataHits: number;
  metadataMisses: number;
  moduleHitRate: string;
  metadataHitRate: string;
  resolveTime: number;
}

export interface CachedResolverOptions extends ModuleCacheOptions {
  /** Extensions to try when resolving. Default: ['.ts', '.tsx', '.js', '.jsx', '.mjs'] */
  extensions?: string[];
  /** Conditions for exports resolution. Default: ['import', 'default'] */
  conditions?: string[];
}

export class CachedResolver {
  private cache: ModuleCache;
  private extensions: string[];
  private conditions: string[];
  private resolveTimeMs = 0;

  constructor(rootDir: string, options: CachedResolverOptions = {}) {
    this.cache = new ModuleCache(rootDir, options);
    this.extensions = options.extensions || ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
    this.conditions = options.conditions || ['import', 'module', 'default'];
  }

  /**
   * Resolve a module specifier with caching
   */
  resolve(specifier: string, importer: string): string | null {
    const start = performance.now();
    
    // Check cache first
    const cached = this.cache.getModule(specifier, importer);
    if (cached) {
      this.resolveTimeMs += performance.now() - start;
      return cached;
    }

    // Actually resolve the module
    const resolved = this.doResolve(specifier, importer);
    
    if (resolved) {
      this.cache.setModule(specifier, importer, resolved);
    }
    
    this.resolveTimeMs += performance.now() - start;
    return resolved;
  }

  private doResolve(specifier: string, importer: string): string | null {
    const importerDir = dirname(importer);

    // Relative import
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      return this.resolveRelative(specifier, importerDir);
    }

    // Package import
    return this.resolvePackage(specifier, importerDir);
  }

  private resolveRelative(specifier: string, fromDir: string): string | null {
    const basePath = resolve(fromDir, specifier);

    // Try exact path
    if (existsSync(basePath) && !this.isDirectory(basePath)) {
      return basePath;
    }

    // Try with extensions
    for (const ext of this.extensions) {
      const withExt = basePath + ext;
      if (existsSync(withExt)) {
        return withExt;
      }
    }

    // Try as directory with index
    if (this.isDirectory(basePath)) {
      for (const ext of this.extensions) {
        const indexPath = join(basePath, `index${ext}`);
        if (existsSync(indexPath)) {
          return indexPath;
        }
      }
    }

    return null;
  }

  private resolvePackage(specifier: string, fromDir: string): string | null {
    // Split package name and subpath
    const parts = specifier.split('/');
    const isScoped = specifier.startsWith('@');
    const packageName = isScoped ? `${parts[0]}/${parts[1]}` : parts[0];
    const subpath = isScoped ? parts.slice(2).join('/') : parts.slice(1).join('/');

    // Find node_modules
    let currentDir = fromDir;
    while (currentDir !== '/') {
      const nodeModulesPath = join(currentDir, 'node_modules', packageName);
      const packageJsonPath = join(nodeModulesPath, 'package.json');

      if (existsSync(packageJsonPath)) {
        return this.resolveFromPackage(packageJsonPath, subpath);
      }

      currentDir = dirname(currentDir);
    }

    return null;
  }

  private resolveFromPackage(packageJsonPath: string, subpath: string): string | null {
    const packageDir = dirname(packageJsonPath);
    
    // Check cached metadata
    let exports: Record<string, unknown> | null = null;
    let main: string | null = null;
    
    const cached = this.cache.getMetadata(packageJsonPath);
    if (cached) {
      exports = cached.exports ? JSON.parse(cached.exports) : null;
      main = cached.main;
    } else {
      // Read and cache package.json
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        exports = pkg.exports || null;
        main = pkg.main || pkg.module || null;
        this.cache.setMetadata(packageJsonPath, exports, main);
      } catch {
        return null;
      }
    }

    // Resolve using exports field
    if (exports) {
      const exportPath = subpath ? `./${subpath}` : '.';
      const resolved = this.resolveExports(exports, exportPath, packageDir);
      if (resolved) return resolved;
    }

    // Fallback to main/index
    if (!subpath) {
      if (main) {
        const mainPath = resolve(packageDir, main);
        if (existsSync(mainPath)) return mainPath;
      }
      
      // Try index files
      for (const ext of this.extensions) {
        const indexPath = join(packageDir, `index${ext}`);
        if (existsSync(indexPath)) return indexPath;
      }
    } else {
      // Direct subpath
      return this.resolveRelative(`./${subpath}`, packageDir);
    }

    return null;
  }

  private resolveExports(
    exports: Record<string, unknown>,
    exportPath: string,
    packageDir: string
  ): string | null {
    // Simple string export
    if (typeof exports === 'string') {
      return resolve(packageDir, exports);
    }

    // Get export entry
    let entry = exports[exportPath];
    
    // Try without the './' prefix
    if (!entry && exportPath === '.') {
      entry = exports['default'] || exports['import'] || exports['module'];
    }

    if (!entry) return null;

    // Resolve conditions
    if (typeof entry === 'string') {
      return resolve(packageDir, entry);
    }

    if (typeof entry === 'object' && entry !== null) {
      for (const condition of this.conditions) {
        const value = (entry as Record<string, unknown>)[condition];
        if (typeof value === 'string') {
          return resolve(packageDir, value);
        }
      }
    }

    return null;
  }

  private isDirectory(path: string): boolean {
    try {
      const stat = require('fs').statSync(path);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Persist cache to disk
   */
  persist() {
    this.cache.persist();
  }

  /**
   * Get resolver statistics
   */
  getStats(): ResolverStats {
    const cacheStats = this.cache.getStats();
    return {
      moduleHits: cacheStats.hits,
      moduleMisses: cacheStats.misses,
      metadataHits: cacheStats.metadataHits,
      metadataMisses: cacheStats.metadataMisses,
      moduleHitRate: cacheStats.moduleHitRate,
      metadataHitRate: cacheStats.metadataHitRate,
      resolveTime: this.resolveTimeMs,
    };
  }

  close() {
    this.cache.close();
  }
}
