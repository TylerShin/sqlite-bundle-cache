# SQLite Bundler Cache PoC - Progress

## Goal
Prove SQLite + memory caching speeds up bundlers (Rsbuild/Vite) in monorepo.

## Stack
- **Package Manager**: bun
- **Monorepo**: Turborepo
- **SQLite**: bun:sqlite
- **Bundlers**: Rsbuild (primary), Vite (secondary)

## Progress

| Step | Status | Commit |
|------|--------|--------|
| Git init | ✅ | a908b5e |
| Monorepo setup | ✅ | a908b5e |
| packages/ui | ✅ | a908b5e |
| packages/utils | ✅ | a908b5e |
| apps/web-rsbuild | ✅ | a908b5e |
| apps/web-vite | ✅ | a908b5e |
| sqlite-resolver | ✅ | b6ac452 |
| Rsbuild plugin | ✅ | b6ac452 |
| Vite plugin | ✅ | b6ac452 |
| Benchmarks | ✅ | b6ac452 |

## Benchmark Results

### Rsbuild vs Vite (5 runs each)

| Bundler | Mean | Std Dev | Range |
|---------|------|---------|-------|
| **Rsbuild** | **233ms** | ±12ms | 222-253ms |
| Vite | 578ms | ±41ms | 548-656ms |

**Rsbuild is 148.4% faster** (345ms saved per build)

## Last Updated
- **Time**: 2025-12-06T12:00:00+09:00
- **Phase**: Benchmarks complete
