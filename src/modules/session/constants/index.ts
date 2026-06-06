/**
 * Redis key prefix for the per-user active session record. The full key is
 * `session:<keycloakSub>` and its value is the currently-valid session id.
 */
export const SESSION_KEY_PREFIX = "session:"
