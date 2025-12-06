import { format, parse, isValid, formatDistanceToNow, addDays as _addDays, differenceInDays } from 'date-fns';

export function formatDate(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  return format(date, formatStr);
}

export function parseDate(dateStr: string, formatStr: string = 'yyyy-MM-dd'): Date {
  return parse(dateStr, formatStr, new Date());
}

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && isValid(date);
}

export function formatRelative(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function addDays(date: Date, days: number): Date {
  return _addDays(date, days);
}

export function diffDays(date1: Date, date2: Date): number {
  return differenceInDays(date1, date2);
}
