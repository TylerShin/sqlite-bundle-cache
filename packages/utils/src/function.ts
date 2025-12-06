import { 
  debounce as _debounce, 
  throttle as _throttle,
  memoize as _memoize,
  once as _once
} from 'lodash-es';

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number = 300
): T {
  return _debounce(fn, wait) as T;
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number = 300
): T {
  return _throttle(fn, wait) as T;
}

export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return _memoize(fn) as T;
}

export function once<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return _once(fn) as T;
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}
