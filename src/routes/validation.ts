import { HttpError } from './httpError';

export function ensureProvided<T>(value: T | null | undefined, field: string): T {
  if (value === undefined || value === null) {
    throw new HttpError(`El campo ${field} es obligatorio.`, 400);
  }
  return value;
}

export function ensureNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(`El campo ${field} es obligatorio.`, 400);
  }
  return value.trim();
}

export function ensureBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  throw new HttpError(`El campo ${field} debe ser un valor booleano.`, 400);
}
