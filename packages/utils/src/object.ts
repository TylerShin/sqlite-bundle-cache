import { cloneDeep, merge, pick as _pick, omit as _omit } from 'lodash-es';

export function deepClone<T>(obj: T): T {
  return cloneDeep(obj);
}

export function deepMerge<T extends object>(...objects: Partial<T>[]): T {
  return merge({}, ...objects) as T;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return _pick(obj, keys) as Pick<T, K>;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  return _omit(obj, keys) as Omit<T, K>;
}
