import { 
  capitalize as _capitalize, 
  kebabCase, 
  truncate as _truncate,
  camelCase as _camelCase,
  snakeCase as _snakeCase,
  upperFirst
} from 'lodash-es';

export function capitalize(str: string): string {
  return _capitalize(str);
}

export function slugify(str: string): string {
  return kebabCase(str);
}

export function truncate(str: string, length: number = 50): string {
  return _truncate(str, { length });
}

export function camelCase(str: string): string {
  return _camelCase(str);
}

export function snakeCase(str: string): string {
  return _snakeCase(str);
}

export function pascalCase(str: string): string {
  return upperFirst(_camelCase(str));
}
