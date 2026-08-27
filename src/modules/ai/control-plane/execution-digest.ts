import {
    createHash,
    timingSafeEqual,
} from "node:crypto"

type JsonPrimitive = boolean | number | string | null
type JsonValue = JsonPrimitive | Array<JsonValue> | { [key: string]: JsonValue }

const DOMAIN_SEPARATOR = Buffer.from([0])
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/u

function assertJsonObject(value: { [key: string]: unknown }): void {
    for (const [
        key,
        nestedValue,
    ] of Object.entries(value)) {
        if (LONE_SURROGATE.test(key)) {
            throw new TypeError("Canonical JSON does not support lone Unicode surrogates")
        }
        if (nestedValue === undefined) {
            throw new TypeError(`Canonical JSON does not support undefined at ${key}`)
        }
        assertJsonValue(nestedValue)
    }
}

/** Digest domains frozen by the Slice 00 contract. */
export const EXECUTION_DIGEST_DOMAINS = {
    accept: "starci.ai.slice00.accept.v1",
    lease: "starci.ai.slice00.lease.v1",
    leaseToken: "starci.ai.slice00.lease-token.v1",
    terminalPayload: "starci.ai.slice00.terminal-payload.v1",
    terminalFence: "starci.ai.slice00.terminal-fence.v1",
} as const

function assertJsonValue(value: unknown): asserts value is JsonValue {
    if (value === null || typeof value === "boolean") {
        return
    }
    if (typeof value === "string") {
        if (LONE_SURROGATE.test(value)) {
            throw new TypeError("Canonical JSON does not support lone Unicode surrogates")
        }
        return
    }
    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            throw new TypeError("Canonical JSON does not support non-finite numbers")
        }
        return
    }
    if (Array.isArray(value)) {
        value.forEach(assertJsonValue)
        return
    }
    if (typeof value === "object") {
        assertJsonObject(value as { [key: string]: unknown })
        return
    }
    throw new TypeError(`Canonical JSON does not support ${typeof value}`)
}

/** Canonicalize a JSON-safe value using RFC 8785 key ordering and scalar encoding. */
export function canonicalizeExecutionJson(value: unknown): string {
    assertJsonValue(value)
    if (value === null || typeof value !== "object") {
        return JSON.stringify(value)
    }
    if (Array.isArray(value)) {
        return `[${value.map(canonicalizeExecutionJson).join(",")}]`
    }
    const members = Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => `${JSON.stringify(key)}:${canonicalizeExecutionJson(value[key])}`)
    return `{${members.join(",")}}`
}

/** Return the raw SHA-256 digest of a domain-separated canonical payload. */
export function executionDigest(domain: string, payload: unknown): Buffer {
    return createHash("sha256")
        .update(Buffer.from(domain,
            "utf8"))
        .update(DOMAIN_SEPARATOR)
        .update(Buffer.from(canonicalizeExecutionJson(payload),
            "utf8"))
        .digest()
}

/** Return the lowercase hexadecimal SHA-256 digest of a canonical payload. */
export function executionDigestHex(domain: string, payload: unknown): string {
    return executionDigest(domain,
        payload).toString("hex")
}

/** Hash an opaque lease token without serializing it as JSON. */
export function digestLeaseToken(token: string): Buffer {
    const rawToken = Buffer.from(token,
        "base64url")
    return createHash("sha256")
        .update(Buffer.from(EXECUTION_DIGEST_DOMAINS.leaseToken,
            "utf8"))
        .update(DOMAIN_SEPARATOR)
        .update(rawToken)
        .digest()
}

/** Compare two fixed-length digests without data-dependent early exit. */
export function executionDigestsEqual(left: Buffer, right: Buffer): boolean {
    return left.length === right.length && timingSafeEqual(left,
        right)
}

/** Format a date for digest tuples with exactly three fractional UTC digits. */
export function canonicalExecutionDate(value: Date): string {
    return value.toISOString()
}
