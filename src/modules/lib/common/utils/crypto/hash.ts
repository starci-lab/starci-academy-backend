import {
    createHash as createHashCrypto,
} from "node:crypto"
import {
    isStringifiablePrimitive,
} from "../stringify-primitive"
/**
 * Stable SHA-256 over mixed args (objects JSON-stringified, joined by `:`).
 * Used for cache / idempotency keys so the same inputs hash the same across
 * processes; argument order is significant.
 */
export const createHash = (...args: Array<unknown>): string => {
    const raw = args.map((a) =>
        isStringifiablePrimitive(a) ? String(a) : JSON.stringify(a),
    ).join(":")
    return createHashCrypto("sha256")
        .update(raw)
        .digest("hex")
}
