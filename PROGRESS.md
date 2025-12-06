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
| sqlite-resolver | 🔄 | - |
| Rsbuild plugin | ⬜ | - |
| Vite plugin | ⬜ | - |
| Benchmarks | ⬜ | - |

## Build Times (Baseline)
- Rsbuild: **1.10s** (169.9 kB total)
- Vite: **454ms** (174.0 kB total)

## Last Updated
- **Time**: 2025-12-06T11:55:00+09:00
- **Phase**: Creating SQLite resolver
