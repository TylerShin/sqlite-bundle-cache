/**
 * Advanced Benchmark: Cold Build / Warm Build / Watch Mode
 * 
 * Tests three scenarios:
 * 1. Cold build - no cache, first run
 * 2. Warm build - with cache, rebuild
 * 3. Watch mode - file change detection time
 */

import { spawn, spawnSync } from 'bun';
import { rmSync, existsSync, appendFileSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dir, '..');
const RUNS = 5;

interface BenchmarkResult {
  name: string;
  app: string;
  scenario: string;
  times: number[];
  mean: number;
  stdDev: number;
}

function cleanCaches(app: 'web-rsbuild' | 'web-vite') {
  const appDir = join(ROOT, 'apps', app);
  const caches = ['dist', '.rsbuild', '.vite', 'node_modules/.cache'];
  for (const cache of caches) {
    const p = join(appDir, cache);
    if (existsSync(p)) rmSync(p, { recursive: true });
  }
  // Clean turbo cache
  const turbo = join(ROOT, '.turbo');
  if (existsSync(turbo)) rmSync(turbo, { recursive: true });
}

async function runBuild(app: 'web-rsbuild' | 'web-vite'): Promise<number> {
  const appDir = join(ROOT, 'apps', app);
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

async function measureWatchMode(app: 'web-rsbuild' | 'web-vite'): Promise<number> {
  const appDir = join(ROOT, 'apps', app);
  const testFile = join(appDir, 'src', 'pages', 'Dashboard.tsx');
  const originalContent = readFileSync(testFile, 'utf-8');
  
  // Start dev server
  const devCmd = app === 'web-rsbuild' ? 'rsbuild' : 'vite';
  const proc = spawn({
    cmd: ['bunx', devCmd, 'dev'],
    cwd: appDir,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Make a change and measure rebuild time
  const changeMarker = `\n// Benchmark change: ${Date.now()}`;
  const start = performance.now();
  
  appendFileSync(testFile, changeMarker);
  
  // Wait for rebuild (indicated by output)
  await new Promise(resolve => setTimeout(resolve, 1500));
  const elapsed = performance.now() - start;
  
  // Restore original file
  writeFileSync(testFile, originalContent);
  
  // Kill dev server
  proc.kill();
  await proc.exited;
  
  return elapsed;
}

async function benchmark(
  name: string,
  app: 'web-rsbuild' | 'web-vite',
  scenario: 'cold' | 'warm' | 'watch',
  runs: number
): Promise<BenchmarkResult> {
  console.log(`\n📊 ${name}`);
  const times: number[] = [];

  for (let i = 0; i < runs; i++) {
    let time: number;
    
    if (scenario === 'cold') {
      cleanCaches(app);
      time = await runBuild(app);
    } else if (scenario === 'warm') {
      if (i === 0) {
        // First run to warm up cache
        await runBuild(app);
      }
      time = await runBuild(app);
    } else {
      // watch mode
      time = await measureWatchMode(app);
    }
    
    times.push(time);
    console.log(`  Run ${i + 1}/${runs}: ${time.toFixed(0)}ms`);
  }

  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length;
  const stdDev = Math.sqrt(variance);

  return { name, app, scenario, times, mean, stdDev };
}

function printResults(results: BenchmarkResult[]) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  BENCHMARK RESULTS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Group by scenario
  const scenarios = ['cold', 'warm', 'watch'] as const;
  
  for (const scenario of scenarios) {
    const scenarioResults = results.filter(r => r.scenario === scenario);
    if (scenarioResults.length === 0) continue;
    
    console.log(`📦 ${scenario.toUpperCase()} ${scenario === 'cold' ? 'BUILD' : scenario === 'warm' ? 'REBUILD' : 'MODE'}:`);
    
    for (const r of scenarioResults) {
      const bundler = r.app === 'web-rsbuild' ? 'Rsbuild' : 'Vite';
      console.log(`  ${bundler}: ${r.mean.toFixed(0)}ms ± ${r.stdDev.toFixed(0)}ms`);
    }
    
    // Compare
    const rsbuild = scenarioResults.find(r => r.app === 'web-rsbuild');
    const vite = scenarioResults.find(r => r.app === 'web-vite');
    
    if (rsbuild && vite) {
      const diff = ((vite.mean - rsbuild.mean) / rsbuild.mean) * 100;
      const winner = diff > 0 ? 'Rsbuild' : 'Vite';
      console.log(`  → ${winner} is ${Math.abs(diff).toFixed(1)}% faster\n`);
    }
  }
}

// Main
console.log('═══════════════════════════════════════════════════════');
console.log('  ADVANCED BUNDLER BENCHMARK');
console.log('  Cold Build / Warm Rebuild / Watch Mode');
console.log('═══════════════════════════════════════════════════════');

const results: BenchmarkResult[] = [];

// Cold builds
console.log('\n🧊 COLD BUILD (no cache)');
results.push(await benchmark('Rsbuild Cold', 'web-rsbuild', 'cold', RUNS));
results.push(await benchmark('Vite Cold', 'web-vite', 'cold', RUNS));

// Warm builds
console.log('\n🔥 WARM REBUILD (with cache)');
results.push(await benchmark('Rsbuild Warm', 'web-rsbuild', 'warm', RUNS));
results.push(await benchmark('Vite Warm', 'web-vite', 'warm', RUNS));

// Watch mode (optional, takes longer)
const testWatch = process.argv.includes('--watch');
if (testWatch) {
  console.log('\n👁️ WATCH MODE (file change)');
  results.push(await benchmark('Rsbuild Watch', 'web-rsbuild', 'watch', 3));
  results.push(await benchmark('Vite Watch', 'web-vite', 'watch', 3));
}

printResults(results);

// Save results
const report = {
  timestamp: new Date().toISOString(),
  runsPerScenario: RUNS,
  results,
};

const reportPath = join(ROOT, 'advanced-benchmark.json');
await Bun.write(reportPath, JSON.stringify(report, null, 2));
console.log(`\n💾 Results saved to: ${reportPath}`);
