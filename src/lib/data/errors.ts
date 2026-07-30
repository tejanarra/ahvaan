// Typed errors thrown by lib/data/* — pages translate NotFoundError to
// notFound(), actions translate either into a user-facing message. Nothing
// outside lib/data/ should construct a raw Supabase error object.
export class NotFoundError extends Error {}
export class DataError extends Error {}
