/**
 * Redis key prefix for the per-user active sessions hash. The full key is
 * `session:<keycloakSub>` and the value is a hash of `sessionId` -> session record
 * JSON (one field per logged-in device).
 */
export const SESSION_KEY_PREFIX = "session:"
