import { format, parse, isValid } from 'date-fns';

export function formatDate(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  return format(date, formatStr);
}

export function parseDate(dateStr: string, formatStr: string = 'yyyy-MM-dd'): Date {
  return parse(dateStr, formatStr, new Date());
}

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && isValid(date);
}
