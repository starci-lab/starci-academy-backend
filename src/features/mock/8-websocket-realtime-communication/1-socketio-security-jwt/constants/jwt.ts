/**
 * Shared secret used to sign and verify JWTs for the security lesson mock.
 *
 * Hardcoded on purpose -- this is a throwaway sandbox signer, not a real
 * identity provider. Never reuse this value for anything that matters.
 */
export const JWT_SECRET = "starci-mock-ws-jwt-secret"

/** Token lifetime; short because tokens are issued fresh on every demo run. */
export const JWT_EXPIRES_IN = "1h"
