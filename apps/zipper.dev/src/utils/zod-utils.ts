import { any } from 'zod';

/**
 * Create a schema matches anything and returns a value. Use it with `or`:
 *
 * ```ts
 * const schema = zod.number();
 * const tolerant = schema.or(fallback(null));
 * schema.parse('foo')      // => ZodError
 * tolerant.parse('foo')    // null
 * ```
 */
export function fallback<T>(value: T) {
  return any().transform(() => value);
}
