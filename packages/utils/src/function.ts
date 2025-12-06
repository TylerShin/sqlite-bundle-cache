import { debounce as _debounce, throttle as _throttle } from 'lodash-es';

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
