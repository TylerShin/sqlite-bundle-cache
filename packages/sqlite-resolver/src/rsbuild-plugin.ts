import { CachedResolver, type CachedResolverOptions } from './resolver';
import type { RsbuildPlugin } from '@rsbuild/core';

export interface RsbuildSqliteCachePluginOptions extends CachedResolverOptions {
  /** Print stats on build end. Default: true */
  printStats?: boolean;
}

export function createRsbuildPlugin(options: RsbuildSqliteCachePluginOptions = {}): RsbuildPlugin {
  let resolver: CachedResolver | null = null;
  const printStats = options.printStats !== false;

  return {
    name: 'sqlite-resolver-cache',
    
    setup(api) {
      // Initialize resolver with project root
      api.onBeforeCreateCompiler(() => {
        const rootDir = api.context.rootPath;
        resolver = new CachedResolver(rootDir, {
          verbose: options.verbose,
          ...options,
        });
      });

      // Hook into module resolution
      api.modifyBundlerChain((chain) => {
        // Add resolve plugin for caching
        chain.resolve.plugin('sqlite-cache').use(class SqliteCachePlugin {
          apply(resolver: any) {
            resolver.hooks.resolve.tapAsync(
              'SqliteCachePlugin',
              (request: any, resolveContext: any, callback: any) => {
                // Let Rspack handle resolution, we just track for now
                // Full interception would require deeper integration
                callback();
              }
            );
          }
        });
      });

      // Print stats and persist cache on build end
      api.onAfterBuild(() => {
        if (resolver) {
          if (printStats) {
            const stats = resolver.getStats();
            console.log('\n[sqlite-resolver] Cache Statistics:');
            console.log(`  Module hits: ${stats.moduleHits}, misses: ${stats.moduleMisses} (${stats.moduleHitRate})`);
            console.log(`  Metadata hits: ${stats.metadataHits}, misses: ${stats.metadataMisses} (${stats.metadataHitRate})`);
            console.log(`  Total resolve time: ${stats.resolveTime.toFixed(2)}ms\n`);
          }
          resolver.persist();
          resolver.close();
        }
      });

      // Handle dev server
      api.onCloseDevServer(() => {
        if (resolver) {
          resolver.persist();
          resolver.close();
        }
      });
    },
  };
}

// Re-export for convenience
export { CachedResolver } from './resolver';
export { ModuleCache } from './cache';
