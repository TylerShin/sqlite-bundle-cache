/**
 * Standalone benchmark for SQLite module resolution cache
 * 
 * This directly compares file system resolution vs SQLite cached resolution
 * without bundler integration (to avoid jiti/bun:sqlite compatibility issues)
 */

import { Database } from 'bun:sqlite';
import { existsSync, statSync, readFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { createHash } from 'crypto';

const ROOT = join(import.meta.dir, '..');
const ITERATIONS = 1000;

// Sample module specifiers to resolve (simulating a real project)
const TEST_SPECIFIERS = [
  'react',
  'react-dom',
  'lodash-es',
  'date-fns',
  '@sqlite-bundle/ui',
  '@sqlite-bundle/utils',
  'react/jsx-runtime',
  'lodash-es/debounce',
  'date-fns/format',
];

interface BenchResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgMicros: number;
}

// ============================================================
// File System Based Resolution (Traditional Approach)
// ============================================================

function resolveWithFileSystem(specifier: string, fromDir: string): string | null {
  const parts = specifier.split('/');
  const isScoped = specifier.startsWith('@');
  const packageName = isScoped ? `${parts[0]}/${parts[1]}` : parts[0];
  
  let currentDir = fromDir;
  while (currentDir !== '/') {
    const nodeModulesPath = join(currentDir, 'node_modules', packageName);
    const packageJsonPath = join(nodeModulesPath, 'package.json');
    
    // This triggers stat() syscall
    if (existsSync(packageJsonPath)) {
      // This triggers open() + read() syscalls
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const main = pkg.main || pkg.module || 'index.js';
      return join(nodeModulesPath, main);
    }
    
    currentDir = dirname(currentDir);
  }
  
  return null;
}

// ============================================================
// SQLite Cached Resolution
// ============================================================

class SQLiteResolver {
  private db: Database;
  private insertStmt: ReturnType<Database['prepare']>;
  private selectStmt: ReturnType<Database['prepare']>;

  constructor() {
    this.db = new Database(':memory:');
    this.db.exec(`
      CREATE TABLE modules (
        specifier TEXT NOT NULL,
        from_dir TEXT NOT NULL,
        resolved_path TEXT,
        metadata TEXT,
        PRIMARY KEY (specifier, from_dir)
      );
      CREATE INDEX idx_specifier ON modules(specifier);
    `);
    
    this.insertStmt = this.db.prepare(
      'INSERT OR REPLACE INTO modules VALUES (?, ?, ?, ?)'
    );
    this.selectStmt = this.db.prepare(
      'SELECT resolved_path, metadata FROM modules WHERE specifier = ? AND from_dir = ?'
    );
  }

  resolve(specifier: string, fromDir: string): string | null {
    // Check cache first
    const cached = this.selectStmt.get(specifier, fromDir) as { resolved_path: string; metadata: string } | null;
    if (cached) {
      return cached.resolved_path;
    }
    
    // Cache miss - do actual resolution
    const resolved = resolveWithFileSystem(specifier, fromDir);
    this.insertStmt.run(specifier, fromDir, resolved, null);
    
    return resolved;
  }

  close() {
    this.db.close();
  }
}

// ============================================================
// Benchmark Functions
// ============================================================

async function benchmarkFileSystem(): Promise<BenchResult> {
  const fromDir = join(ROOT, 'apps', 'web-rsbuild', 'src');
  
  const start = performance.now();
  
  for (let i = 0; i < ITERATIONS; i++) {
    for (const spec of TEST_SPECIFIERS) {
      resolveWithFileSystem(spec, fromDir);
    }
  }
  
  const totalMs = performance.now() - start;
  const totalOps = ITERATIONS * TEST_SPECIFIERS.length;
  
  return {
    name: 'File System (stat + read each time)',
    iterations: totalOps,
    totalMs,
    avgMicros: (totalMs * 1000) / totalOps,
  };
}

async function benchmarkSQLite(): Promise<BenchResult> {
  const fromDir = join(ROOT, 'apps', 'web-rsbuild', 'src');
  const resolver = new SQLiteResolver();
  
  // Warm up cache with first iteration
  for (const spec of TEST_SPECIFIERS) {
    resolver.resolve(spec, fromDir);
  }
  
  const start = performance.now();
  
  for (let i = 0; i < ITERATIONS; i++) {
    for (const spec of TEST_SPECIFIERS) {
      resolver.resolve(spec, fromDir);
    }
  }
  
  const totalMs = performance.now() - start;
  const totalOps = ITERATIONS * TEST_SPECIFIERS.length;
  
  resolver.close();
  
  return {
    name: 'SQLite Cache (memory)',
    iterations: totalOps,
    totalMs,
    avgMicros: (totalMs * 1000) / totalOps,
  };
}

async function benchmarkSQLiteColdStart(): Promise<BenchResult> {
  const fromDir = join(ROOT, 'apps', 'web-rsbuild', 'src');
  const resolver = new SQLiteResolver();
  
  const start = performance.now();
  
  // No warmup - measure cold start performance
  for (let i = 0; i < ITERATIONS; i++) {
    for (const spec of TEST_SPECIFIERS) {
      resolver.resolve(spec, fromDir);
    }
  }
  
  const totalMs = performance.now() - start;
  const totalOps = ITERATIONS * TEST_SPECIFIERS.length;
  
  resolver.close();
  
  return {
    name: 'SQLite Cache (cold start)',
    iterations: totalOps,
    totalMs,
    avgMicros: (totalMs * 1000) / totalOps,
  };
}

function printResult(result: BenchResult) {
  console.log(`\n${result.name}:`);
  console.log(`  Total time:     ${result.totalMs.toFixed(2)}ms`);
  console.log(`  Operations:     ${result.iterations}`);
  console.log(`  Avg per op:     ${result.avgMicros.toFixed(3)}μs`);
  console.log(`  Ops per second: ${(1000000 / result.avgMicros).toFixed(0)}`);
}

// ============================================================
// Main
// ============================================================

console.log('═══════════════════════════════════════════');
console.log('  SQLite Module Resolution Benchmark');
console.log('═══════════════════════════════════════════');
console.log(`\nIterations: ${ITERATIONS} × ${TEST_SPECIFIERS.length} modules = ${ITERATIONS * TEST_SPECIFIERS.length} ops\n`);

console.log('Running benchmarks...');

const fsResult = await benchmarkFileSystem();
printResult(fsResult);

const sqliteColdResult = await benchmarkSQLiteColdStart();
printResult(sqliteColdResult);

const sqliteWarmResult = await benchmarkSQLite();
printResult(sqliteWarmResult);

// Comparison
console.log('\n═══════════════════════════════════════════');
console.log('  RESULTS');
console.log('═══════════════════════════════════════════');

const coldImprovement = ((fsResult.avgMicros - sqliteColdResult.avgMicros) / fsResult.avgMicros) * 100;
const warmImprovement = ((fsResult.avgMicros - sqliteWarmResult.avgMicros) / fsResult.avgMicros) * 100;

console.log(`\n📊 SQLite Cold Start: ${coldImprovement > 0 ? '✅' : '❌'} ${Math.abs(coldImprovement).toFixed(1)}% ${coldImprovement > 0 ? 'faster' : 'slower'} than FS`);
console.log(`📊 SQLite Warm Cache: ${warmImprovement > 0 ? '✅' : '❌'} ${Math.abs(warmImprovement).toFixed(1)}% ${warmImprovement > 0 ? 'faster' : 'slower'} than FS`);

const speedupFactor = fsResult.avgMicros / sqliteWarmResult.avgMicros;
console.log(`\n🚀 Warm SQLite is ${speedupFactor.toFixed(1)}x faster than file system`);

// Save results
const report = {
  timestamp: new Date().toISOString(),
  iterations: ITERATIONS,
  modulesPerIteration: TEST_SPECIFIERS.length,
  results: {
    fileSystem: fsResult,
    sqliteCold: sqliteColdResult,
    sqliteWarm: sqliteWarmResult,
  },
  improvements: {
    coldVsFs: coldImprovement,
    warmVsFs: warmImprovement,
    speedupFactor,
  },
};

const reportPath = join(ROOT, 'resolution-benchmark.json');
await Bun.write(reportPath, JSON.stringify(report, null, 2));
console.log(`\n💾 Results saved to: ${reportPath}`);
