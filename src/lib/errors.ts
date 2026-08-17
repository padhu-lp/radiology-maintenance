/**
 * Turn a Postgres/PostgREST error into something a user can act on.
 * Centralised so every form reports failures the same way.
 */
export function describeDbError(err: unknown): { title: string; description: string } {
  const e = err as { code?: string; message?: string; details?: string } | null

  switch (e?.code) {
    case '42501': // insufficient_privilege — RLS rejected the write
      return {
        title: 'Permission denied',
        description: 'Your account does not have permission for this change. Ask an administrator.',
      }
    case '23505': // unique_violation
      return {
        title: 'Already exists',
        description: 'A record with that unique value already exists. Check codes and numbers.',
      }
    case '23503': // foreign_key_violation
      return {
        title: 'Still referenced',
        description: 'This record is linked to others and cannot be changed or removed yet.',
      }
    case '23514': // check_violation
      return {
        title: 'Invalid value',
        description: e?.message ?? 'One of the values is not allowed for this field.',
      }
    case '23502': // not_null_violation
      return { title: 'Missing required value', description: e?.message ?? 'A required field is empty.' }
  }

  // RLS can also surface as a message rather than a code, depending on the path.
  if (e?.message?.includes('row-level security')) {
    return {
      title: 'Permission denied',
      description: 'Your account does not have permission for this change.',
    }
  }

  return { title: 'Could not save', description: e?.message ?? 'Unexpected error' }
}

/** Empty strings must become NULL so "no value" stays unambiguous in the database. */
export function nullBlanks<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    out[k] = v === '' || v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? null : v
  }
  return out
}

/** shadcn Select cannot hold an empty string value, so nullable selects use this. */
export const NONE = '__none__'
export const fromNone = (v: string | undefined | null) => (!v || v === NONE ? null : v)
export const toNone = (v: string | null | undefined) => v ?? NONE
