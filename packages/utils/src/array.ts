import { chunk as _chunk, uniq, groupBy as _groupBy, sortBy as _sortBy } from 'lodash-es';

export function chunk<T>(array: T[], size: number): T[][] {
  return _chunk(array, size);
}

export function unique<T>(array: T[]): T[] {
  return uniq(array);
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return _groupBy(array, key);
}

export function sortBy<T>(array: T[], key: keyof T): T[] {
  return _sortBy(array, key);
}
