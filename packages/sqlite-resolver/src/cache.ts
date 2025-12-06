import { Database } from 'bun:sqlite';
import { createHash } from 'crypto';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

export interface ModuleCacheOptions {
  /** Path to SQLite database file. Default: '.sqlite-cache/modules.db' */
  dbPath?: string;
  /** Use in-memory mode with file backup. Default: true */
  inMemory?: boolean;
  /** Enable verbose logging. Default: false */
  verbose?: boolean;
}

export interface CachedModule {
  specifier: string;
  importer: string;
  resolvedPath: string;
  lockfileHash: string;
}

export interface CachedMetadata {
  packagePath: string;
  exports: string | null;
  main: string | null;
  mtime: number;
}

export class ModuleCache {
  private db: Database;
  private lockfileHash: string;
  private verbose: boolean;
  
  public stats = {
    hits: 0,
    misses: 0,
    metadataHits: 0,
    metadataMisses: 0,
  };

  constructor(private rootDir: string, options: ModuleCacheOptions = {}) {
    const dbPath = options.dbPath || join(rootDir, '.sqlite-cache', 'modules.db');
    this.verbose = options.verbose || false;
    
    // Create directory if needed
    const dir = join(rootDir, '.sqlite-cache');
    if (!existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }

    // Calculate lockfile hash for cache invalidation
    this.lockfileHash = this.calculateLockfileHash();

    // Open database (in-memory with file backing for speed)
    if (options.inMemory !== false) {
      this.db = new Database(':memory:');
      // Load from file if exists
      if (existsSync(dbPath)) {
        try {
          const fileDb = new Database(dbPath);
          // Check if lockfile hash matches
          const storedHash = fileDb.query<{ value: string }, []>(
            'SELECT value FROM meta WHERE key = ?'
          ).get('lockfile_hash');
          
          if (storedHash?.value === this.lockfileHash) {
            // Copy data to memory
            this.db.exec(`ATTACH DATABASE '${dbPath}' AS disk`);
            this.initSchema();
            this.db.exec(`
              INSERT OR REPLACE INTO modules SELECT * FROM disk.modules;
              INSERT OR REPLACE INTO metadata SELECT * FROM disk.metadata;
              INSERT OR REPLACE INTO meta SELECT * FROM disk.meta;
            `);
            this.db.exec('DETACH DATABASE disk');
            this.log(`Loaded cache from ${dbPath}`);
          } else {
            this.log('Lockfile changed, invalidating cache');
            this.initSchema();
          }
          fileDb.close();
        } catch {
          this.initSchema();
        }
      } else {
        this.initSchema();
      }
    } else {
      this.db = new Database(dbPath);
      this.initSchema();
    }
    
    // Store current lockfile hash
    this.db.run('INSERT OR REPLACE INTO meta VALUES (?, ?)', ['lockfile_hash', this.lockfileHash]);
  }

  private log(msg: string) {
    if (this.verbose) {
      console.log(`[sqlite-resolver] ${msg}`);
    }
  }

  private calculateLockfileHash(): string {
    const lockfiles = ['bun.lock', 'bun.lockb', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
    
    for (const lockfile of lockfiles) {
      const path = join(this.rootDir, lockfile);
      if (existsSync(path)) {
        const content = readFileSync(path);
        return createHash('md5').update(content).digest('hex').slice(0, 16);
      }
    }
    
    // Fallback: hash package.json
    const pkgPath = join(this.rootDir, 'package.json');
    if (existsSync(pkgPath)) {
      const content = readFileSync(pkgPath);
      return createHash('md5').update(content).digest('hex').slice(0, 16);
    }
    
    return 'no-lockfile';
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modules (
        specifier TEXT NOT NULL,
        importer TEXT NOT NULL,
        resolved_path TEXT NOT NULL,
        lockfile_hash TEXT NOT NULL,
        PRIMARY KEY (specifier, importer)
      );
      
      CREATE TABLE IF NOT EXISTS metadata (
        package_path TEXT PRIMARY KEY,
        exports TEXT,
        main TEXT,
        mtime INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_modules_hash ON modules(lockfile_hash);
      CREATE INDEX IF NOT EXISTS idx_metadata_mtime ON metadata(mtime);
    `);
  }

  getModule(specifier: string, importer: string): string | null {
    const row = this.db.query<{ resolved_path: string }, [string, string, string]>(
      'SELECT resolved_path FROM modules WHERE specifier = ? AND importer = ? AND lockfile_hash = ?'
    ).get(specifier, importer, this.lockfileHash);
    
    if (row) {
      this.stats.hits++;
      return row.resolved_path;
    }
    
    this.stats.misses++;
    return null;
  }

  setModule(specifier: string, importer: string, resolvedPath: string) {
    this.db.run(
      'INSERT OR REPLACE INTO modules VALUES (?, ?, ?, ?)',
      [specifier, importer, resolvedPath, this.lockfileHash]
    );
  }

  getMetadata(packagePath: string): CachedMetadata | null {
    try {
      const stat = statSync(packagePath);
      const mtime = Math.floor(stat.mtimeMs);
      
      const row = this.db.query<{ exports: string | null; main: string | null; mtime: number }, [string]>(
        'SELECT exports, main, mtime FROM metadata WHERE package_path = ?'
      ).get(packagePath);
      
      if (row && row.mtime === mtime) {
        this.stats.metadataHits++;
        return {
          packagePath,
          exports: row.exports,
          main: row.main,
          mtime: row.mtime,
        };
      }
    } catch {
      // File doesn't exist
    }
    
    this.stats.metadataMisses++;
    return null;
  }

  setMetadata(packagePath: string, exports: object | null, main: string | null) {
    try {
      const stat = statSync(packagePath);
      const mtime = Math.floor(stat.mtimeMs);
      
      this.db.run(
        'INSERT OR REPLACE INTO metadata VALUES (?, ?, ?, ?)',
        [packagePath, exports ? JSON.stringify(exports) : null, main, mtime]
      );
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /** Save in-memory database to disk */
  persist(dbPath?: string) {
    const targetPath = dbPath || join(this.rootDir, '.sqlite-cache', 'modules.db');
    
    // Create new file database and copy data
    const fileDb = new Database(targetPath);
    fileDb.exec(`
      CREATE TABLE IF NOT EXISTS modules (
        specifier TEXT NOT NULL,
        importer TEXT NOT NULL,
        resolved_path TEXT NOT NULL,
        lockfile_hash TEXT NOT NULL,
        PRIMARY KEY (specifier, importer)
      );
      CREATE TABLE IF NOT EXISTS metadata (
        package_path TEXT PRIMARY KEY,
        exports TEXT,
        main TEXT,
        mtime INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    
    // Export from memory to file
    const modules = this.db.query<CachedModule, []>('SELECT * FROM modules').all();
    const metadata = this.db.query<CachedMetadata, []>('SELECT * FROM metadata').all();
    
    for (const m of modules) {
      fileDb.run('INSERT OR REPLACE INTO modules VALUES (?, ?, ?, ?)', 
        [m.specifier, m.importer, m.resolvedPath, m.lockfileHash]);
    }
    
    for (const m of metadata) {
      fileDb.run('INSERT OR REPLACE INTO metadata VALUES (?, ?, ?, ?)',
        [m.packagePath, m.exports, m.main, m.mtime]);
    }
    
    fileDb.run('INSERT OR REPLACE INTO meta VALUES (?, ?)', ['lockfile_hash', this.lockfileHash]);
    fileDb.close();
    
    this.log(`Persisted cache to ${targetPath}`);
  }

  getStats() {
    const totalModules = this.stats.hits + this.stats.misses;
    const totalMetadata = this.stats.metadataHits + this.stats.metadataMisses;
    
    return {
      ...this.stats,
      moduleHitRate: totalModules > 0 ? (this.stats.hits / totalModules * 100).toFixed(1) + '%' : 'N/A',
      metadataHitRate: totalMetadata > 0 ? (this.stats.metadataHits / totalMetadata * 100).toFixed(1) + '%' : 'N/A',
    };
  }

  close() {
    this.db.close();
  }
}
