import { CachedResolver, type CachedResolverOptions } from './resolver';
import type { Plugin } from 'vite';

export interface ViteSqliteCachePluginOptions extends CachedResolverOptions {
  /** Print stats on build end. Default: true */
  printStats?: boolean;
}

export function createVitePlugin(options: ViteSqliteCachePluginOptions = {}): Plugin {
  let resolver: CachedResolver | null = null;
  const printStats = options.printStats !== false;

  return {
    name: 'sqlite-resolver-cache',
    enforce: 'pre',

    configResolved(config) {
      resolver = new CachedResolver(config.root, {
        verbose: options.verbose,
        ...options,
      });
    },

    resolveId: {
      order: 'pre',
      async handler(source, importer) {
        if (!resolver || !importer) return null;
        
        // Skip virtual modules and node built-ins
        if (source.startsWith('\0') || source.startsWith('node:')) {
          return null;
        }

        // Try to resolve from cache
        const cached = resolver.resolve(source, importer);
        
        // Return cached result or let Vite handle it
        // Note: We're using the cache to track resolution, 
        // but letting Vite do the actual resolution for correctness
        return null; // Let Vite resolve, we just pre-warm the cache
      },
    },

    buildEnd() {
      if (resolver && printStats) {
        const stats = resolver.getStats();
        console.log('\n[sqlite-resolver] Cache Statistics:');
        console.log(`  Module hits: ${stats.moduleHits}, misses: ${stats.moduleMisses} (${stats.moduleHitRate})`);
        console.log(`  Metadata hits: ${stats.metadataHits}, misses: ${stats.metadataMisses} (${stats.metadataHitRate})`);
        console.log(`  Total resolve time: ${stats.resolveTime.toFixed(2)}ms\n`);
      }
    },

    closeBundle() {
      if (resolver) {
        resolver.persist();
        resolver.close();
      }
    },
  };
}

// Re-export for convenience
export { CachedResolver } from './resolver';
export { ModuleCache } from './cache';
