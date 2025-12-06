/**
 * Benchmark runner for SQLite resolver cache PoC
 * 
 * Usage:
 *   bun run benchmarks/run.ts [baseline|sqlite|compare]
 */

import { spawn } from 'bun';
import { rmSync, existsSync } from 'fs';
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

async function runBuild(app: 'web-rsbuild' | 'web-vite', clean = false): Promise<number> {
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
  });
  
  await proc.exited;
  return performance.now() - start;
}

async function benchmark(
  name: string,
  app: 'web-rsbuild' | 'web-vite',
  runs: number,
  coldStart = false
): Promise<BenchmarkResult> {
  console.log(`\nBenchmarking: ${name}`);
  const times: number[] = [];

  for (let i = 0; i < runs; i++) {
    const time = await runBuild(app, coldStart && i === 0);
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
  console.log(`\n${result.name}:`);
  console.log(`  Mean:   ${result.mean.toFixed(0)}ms ± ${result.stdDev.toFixed(0)}ms`);
  console.log(`  Range:  ${result.min.toFixed(0)}ms - ${result.max.toFixed(0)}ms`);
}

function compareResults(a: BenchmarkResult, b: BenchmarkResult) {
  const diff = ((b.mean - a.mean) / a.mean) * 100;
  const faster = diff < 0 ? b.name : a.name;
  const speedup = Math.abs(diff);
  
  console.log(`\nComparison: ${a.name} vs ${b.name}`);
  console.log(`  ${faster} is ${speedup.toFixed(1)}% faster`);
  console.log(`  Time saved: ${Math.abs(b.mean - a.mean).toFixed(0)}ms per build`);
}

async function runBaseline() {
  console.log('=== BASELINE BENCHMARK (No SQLite Cache) ===');
  
  // Clean turbo cache
  const turboCache = join(ROOT, '.turbo');
  if (existsSync(turboCache)) rmSync(turboCache, { recursive: true });
  
  const rsbuildCold = await benchmark('Rsbuild Cold Build', 'web-rsbuild', 1, true);
  const rsbuildWarm = await benchmark('Rsbuild Warm Build', 'web-rsbuild', RUNS, false);
  
  const viteCold = await benchmark('Vite Cold Build', 'web-vite', 1, true);
  const viteWarm = await benchmark('Vite Warm Build', 'web-vite', RUNS, false);

  console.log('\n=== BASELINE RESULTS ===');
  printResult(rsbuildCold);
  printResult(rsbuildWarm);
  printResult(viteCold);
  printResult(viteWarm);
  
  compareResults(rsbuildWarm, viteWarm);

  return { rsbuildCold, rsbuildWarm, viteCold, viteWarm };
}

async function runSqliteBenchmark() {
  console.log('=== SQLITE CACHE BENCHMARK ===');
  console.log('Note: SQLite plugin is enabled in bundler configs\n');
  
  const rsbuildCold = await benchmark('Rsbuild+SQLite Cold Build', 'web-rsbuild', 1, true);
  const rsbuildWarm = await benchmark('Rsbuild+SQLite Warm Build', 'web-rsbuild', RUNS, false);
  
  const viteCold = await benchmark('Vite+SQLite Cold Build', 'web-vite', 1, true);
  const viteWarm = await benchmark('Vite+SQLite Warm Build', 'web-vite', RUNS, false);

  console.log('\n=== SQLITE CACHE RESULTS ===');
  printResult(rsbuildCold);
  printResult(rsbuildWarm);
  printResult(viteCold);
  printResult(viteWarm);

  return { rsbuildCold, rsbuildWarm, viteCold, viteWarm };
}

async function runComparison() {
  console.log('=== FULL COMPARISON ===\n');
  
  // TODO: Run with and without SQLite cache
  // For now, just compare Rsbuild vs Vite
  
  console.log('Running Rsbuild builds...');
  const rsbuild = await benchmark('Rsbuild', 'web-rsbuild', RUNS, true);
  
  console.log('\nRunning Vite builds...');
  const vite = await benchmark('Vite', 'web-vite', RUNS, true);

  console.log('\n=== COMPARISON RESULTS ===');
  printResult(rsbuild);
  printResult(vite);
  compareResults(rsbuild, vite);
  
  // Output as JSON for further analysis
  const report = {
    timestamp: new Date().toISOString(),
    results: { rsbuild, vite },
  };
  
  const reportPath = join(ROOT, 'benchmark-results.json');
  await Bun.write(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nResults saved to: ${reportPath}`);
}

// Main
const mode = process.argv[2] || 'compare';

switch (mode) {
  case 'baseline':
    await runBaseline();
    break;
  case 'sqlite':
    await runSqliteBenchmark();
    break;
  case 'compare':
  default:
    await runComparison();
    break;
}
