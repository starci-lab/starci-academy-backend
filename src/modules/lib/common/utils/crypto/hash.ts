import {
    createHash as createHashCrypto,
} from "crypto"
/**
 * Stable SHA-256 over mixed args (objects JSON-stringified, joined by `:`).
 * Used for cache / idempotency keys so the same inputs hash the same across
 * processes; argument order is significant.
 */
export const createHash = (...args: Array<unknown>): string => {
    const raw = args.map((a) =>
        typeof a === "object" ? JSON.stringify(a) : String(a),
    ).join(":")
    return createHashCrypto("sha256")
        .update(raw)
        .digest("hex")
}
