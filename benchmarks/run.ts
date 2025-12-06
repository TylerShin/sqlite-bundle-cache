/**
 * Benchmark runner for SQLite resolver cache PoC
 * 
 * Usage:
 *   bun run benchmarks/run.ts [baseline|sqlite|full]
 */

import { spawn } from 'bun';
import { rmSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dir, '..');
const RUNS = 5;

interface BenchmarkResult {
  name: string;
  times: number[];
  mean: number;
  min: number;
  max: number;
  stdDev: number;
}

interface FullReport {
  timestamp: string;
  baseline: {
    rsbuild: BenchmarkResult;
    vite: BenchmarkResult;
  };
  withSqlite: {
    rsbuild: BenchmarkResult;
    vite: BenchmarkResult;
  };
  improvements: {
    rsbuild: number;
    vite: number;
  };
}

async function runBuild(
  app: 'web-rsbuild' | 'web-vite', 
  useSqliteCache: boolean,
  clean = false
): Promise<number> {
  const appDir = join(ROOT, 'apps', app);
  
  if (clean) {
    // Clean build caches
    const cachePaths = [
      join(appDir, 'dist'),
      join(appDir, '.rsbuild'),
      join(appDir, '.vite'),
      join(appDir, '.sqlite-cache'),
    ];
    for (const p of cachePaths) {
      if (existsSync(p)) rmSync(p, { recursive: true });
    }
  }

  const start = performance.now();
  const proc = spawn({
    cmd: ['bun', 'run', 'build'],
    cwd: appDir,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      USE_SQLITE_CACHE: useSqliteCache ? 'true' : 'false',
    },
  });
  
  await proc.exited;
  return performance.now() - start;
}

async function benchmark(
  name: string,
  app: 'web-rsbuild' | 'web-vite',
  useSqliteCache: boolean,
  runs: number,
  coldStart = false
): Promise<BenchmarkResult> {
  console.log(`\n📊 Benchmarking: ${name}`);
  const times: number[] = [];

  for (let i = 0; i < runs; i++) {
    const time = await runBuild(app, useSqliteCache, coldStart && i === 0);
    times.push(time);
    process.stdout.write(`  Run ${i + 1}/${runs}: ${time.toFixed(0)}ms\n`);
  }

  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length;
  const stdDev = Math.sqrt(variance);

  return { name, times, mean, min, max, stdDev };
}

function printResult(result: BenchmarkResult) {
  console.log(`  ${result.name}:`);
  console.log(`    Mean:   ${result.mean.toFixed(0)}ms ± ${result.stdDev.toFixed(0)}ms`);
  console.log(`    Range:  ${result.min.toFixed(0)}ms - ${result.max.toFixed(0)}ms`);
}

function printComparison(baseline: BenchmarkResult, withCache: BenchmarkResult) {
  const diff = ((withCache.mean - baseline.mean) / baseline.mean) * 100;
  const isFaster = diff < 0;
  const improvement = Math.abs(diff);
  
  console.log(`    ${isFaster ? '✅' : '❌'} ${isFaster ? 'Faster' : 'Slower'} by ${improvement.toFixed(1)}%`);
  console.log(`    Time ${isFaster ? 'saved' : 'added'}: ${Math.abs(withCache.mean - baseline.mean).toFixed(0)}ms`);
  
  return diff;
}

async function runBaseline() {
  console.log('\n═══════════════════════════════════════');
  console.log('  BASELINE (No SQLite Cache)');
  console.log('═══════════════════════════════════════');
  
  const rsbuild = await benchmark('Rsbuild Baseline', 'web-rsbuild', false, RUNS, true);
  const vite = await benchmark('Vite Baseline', 'web-vite', false, RUNS, true);

  console.log('\n📈 Baseline Results:');
  printResult(rsbuild);
  printResult(vite);

  return { rsbuild, vite };
}

async function runWithSqlite() {
  console.log('\n═══════════════════════════════════════');
  console.log('  WITH SQLite CACHE');
  console.log('═══════════════════════════════════════');
  
  const rsbuild = await benchmark('Rsbuild + SQLite', 'web-rsbuild', true, RUNS, true);
  const vite = await benchmark('Vite + SQLite', 'web-vite', true, RUNS, true);

  console.log('\n📈 SQLite Cache Results:');
  printResult(rsbuild);
  printResult(vite);

  return { rsbuild, vite };
}

async function runFullComparison() {
  console.log('\n🔬 FULL A/B COMPARISON');
  console.log('Testing with and without SQLite cache\n');
  
  // Clean everything first
  console.log('🧹 Cleaning all caches...');
  const appDirs = ['web-rsbuild', 'web-vite'];
  for (const app of appDirs) {
    const appDir = join(ROOT, 'apps', app);
    for (const cache of ['dist', '.rsbuild', '.vite', '.sqlite-cache']) {
      const p = join(appDir, cache);
      if (existsSync(p)) rmSync(p, { recursive: true });
    }
  }
  
  // Clean turbo cache
  const turboCache = join(ROOT, '.turbo');
  if (existsSync(turboCache)) rmSync(turboCache, { recursive: true });

  // Run baseline
  const baseline = await runBaseline();
  
  // Clean again before SQLite test
  console.log('\n🧹 Cleaning caches before SQLite test...');
  for (const app of appDirs) {
    const appDir = join(ROOT, 'apps', app);
    for (const cache of ['dist', '.rsbuild', '.vite', '.sqlite-cache']) {
      const p = join(appDir, cache);
      if (existsSync(p)) rmSync(p, { recursive: true });
    }
  }
  
  // Run with SQLite
  const withSqlite = await runWithSqlite();

  // Print comparison
  console.log('\n═══════════════════════════════════════');
  console.log('  COMPARISON RESULTS');
  console.log('═══════════════════════════════════════');
  
  console.log('\n🏗️ Rsbuild:');
  console.log(`  Baseline:    ${baseline.rsbuild.mean.toFixed(0)}ms`);
  console.log(`  With SQLite: ${withSqlite.rsbuild.mean.toFixed(0)}ms`);
  const rsbuildImprovement = printComparison(baseline.rsbuild, withSqlite.rsbuild);
  
  console.log('\n⚡ Vite:');
  console.log(`  Baseline:    ${baseline.vite.mean.toFixed(0)}ms`);
  console.log(`  With SQLite: ${withSqlite.vite.mean.toFixed(0)}ms`);
  const viteImprovement = printComparison(baseline.vite, withSqlite.vite);
  
  console.log('\n📊 Bundler Comparison (with SQLite):');
  const bundlerDiff = ((withSqlite.vite.mean - withSqlite.rsbuild.mean) / withSqlite.rsbuild.mean) * 100;
  console.log(`  Rsbuild is ${bundlerDiff.toFixed(1)}% faster than Vite`);

  // Save report
  const report: FullReport = {
    timestamp: new Date().toISOString(),
    baseline: {
      rsbuild: baseline.rsbuild,
      vite: baseline.vite,
    },
    withSqlite: {
      rsbuild: withSqlite.rsbuild,
      vite: withSqlite.vite,
    },
    improvements: {
      rsbuild: -rsbuildImprovement,
      vite: -viteImprovement,
    },
  };

  const reportPath = join(ROOT, 'benchmark-results.json');
  await Bun.write(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Full report saved to: ${reportPath}`);
  
  return report;
}

// Main
const mode = process.argv[2] || 'full';

switch (mode) {
  case 'baseline':
    await runBaseline();
    break;
  case 'sqlite':
    await runWithSqlite();
    break;
  case 'full':
  default:
    await runFullComparison();
    break;
}
