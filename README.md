# SQLite Bundler Cache PoC

> **TL;DR**: SQLite를 사용하면 모듈 해석이 **19.9배** 빠르고, Rsbuild가 Vite보다 **2배** 빠릅니다.  
> **TL;DR**: SQLite makes module resolution **19.9x faster**, and Rsbuild is **2x faster** than Vite.

---

## 🇰🇷 한글

### 배경

Bun의 [Behind the Scenes of Bun Install](https://bun.com/blog/behind-the-scenes-of-bun-install) 글을 보고 떠오른 아이디어:

> "Zig로 syscall을 줄이는 것도 좋지만, 아예 SQLite + 메모리로 I/O를 관리하면 더 빠르지 않을까?"

### 원리

번들러가 `import "react"`를 해석할 때:

```
📁 파일시스템 방식 (기존)
1. stat("node_modules/react")      → syscall #1
2. open("package.json")            → syscall #2
3. read(...)                       → syscall #3
4. JSON.parse()                    → CPU 작업
5. stat("dist/react.esm.js")       → syscall #4
= 최소 4번의 syscall + 매번 파싱

💾 SQLite 방식 (새로운)
1. SELECT path FROM cache WHERE name='react'
= 메모리 조회 1번, syscall 0번
```

**Syscall은 커널 모드 전환이 필요해서 느립니다** (1회당 2000-3000 CPU cycles).  
SQLite는 메모리에서 해시 테이블 조회만 하면 됩니다 (~100 cycles).

### 결과

#### 모듈 해석 속도 (9,000회 테스트)

| 방식 | 평균 시간 | 배수 |
|------|----------|------|
| 파일시스템 | 8.23μs | 1x |
| **SQLite** | **0.41μs** | **19.9x** |

#### 번들러 빌드 속도 (180KB 번들)

| 시나리오 | Rsbuild | Vite | 차이 |
|----------|---------|------|------|
| Cold Build | 305ms | 625ms | **Rsbuild 2x** |
| Warm Build | 257ms | 609ms | **Rsbuild 2.4x** |

### 실행 방법

```bash
# 설치
bun install

# 모듈 해석 벤치마크 (SQLite vs 파일시스템)
bun run benchmarks/resolution-bench.ts

# 번들러 벤치마크 (Rsbuild vs Vite)
bun run benchmarks/run.ts
```

---

## 🇺🇸 English

### Background

Inspired by Bun's [Behind the Scenes of Bun Install](https://bun.com/blog/behind-the-scenes-of-bun-install):

> "Instead of just reducing syscalls with Zig, what if we use SQLite + memory for I/O management?"

### How It Works

When a bundler resolves `import "react"`:

```
📁 File System (Traditional)
1. stat("node_modules/react")      → syscall #1
2. open("package.json")            → syscall #2
3. read(...)                       → syscall #3
4. JSON.parse()                    → CPU work
5. stat("dist/react.esm.js")       → syscall #4
= At least 4 syscalls + parsing each time

💾 SQLite (New Approach)
1. SELECT path FROM cache WHERE name='react'
= 1 memory lookup, 0 syscalls
```

**Syscalls are slow** because they require kernel mode switches (2000-3000 CPU cycles each).  
SQLite just does a hash table lookup in memory (~100 cycles).

### Results

#### Module Resolution Speed (9,000 ops)

| Method | Avg Time | Speedup |
|--------|----------|---------|
| File System | 8.23μs | 1x |
| **SQLite** | **0.41μs** | **19.9x** |

#### Bundler Build Speed (180KB bundle)

| Scenario | Rsbuild | Vite | Difference |
|----------|---------|------|------------|
| Cold Build | 305ms | 625ms | **Rsbuild 2x faster** |
| Warm Build | 257ms | 609ms | **Rsbuild 2.4x faster** |

### Run Benchmarks

```bash
# Install
bun install

# Module resolution benchmark (SQLite vs File System)
bun run benchmarks/resolution-bench.ts

# Bundler benchmark (Rsbuild vs Vite)
bun run benchmarks/run.ts
```

---

## 📁 Project Structure

```
sqlite-bundle/
├── apps/
│   ├── web-rsbuild/    # Rsbuild React app (3 pages)
│   └── web-vite/       # Vite React app (3 pages)
├── packages/
│   ├── ui/             # 15 React components
│   ├── utils/          # 30+ utility functions
│   └── sqlite-resolver/# SQLite cache (bun:sqlite)
└── benchmarks/
    ├── run.ts          # Bundler benchmarks
    └── resolution-bench.ts # Resolution benchmarks
```

## License

MIT
