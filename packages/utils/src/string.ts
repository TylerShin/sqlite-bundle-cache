import { capitalize as _capitalize, kebabCase, truncate as _truncate } from 'lodash-es';

export function capitalize(str: string): string {
  return _capitalize(str);
}

export function slugify(str: string): string {
  return kebabCase(str);
}

export function truncate(str: string, length: number = 50): string {
  return _truncate(str, { length });
}
