import {
    EXECUTION_DIGEST_DOMAINS,
    canonicalExecutionDate,
    canonicalizeExecutionJson,
    digestLeaseToken,
    executionDigestHex,
    executionDigestsEqual,
} from "./execution-digest"
import digestFixture from "@tests/fixtures/ai-execution-control/digest-v1.json"

describe("execution digest",
    () => {
        it("canonicalizes equivalent objects independently of insertion order",
            () => {
                const left = {
                    z: 1,
                    nested: {
                        beta: true,
                        alpha: "value",
                    },
                    a: [3,
                        null],
                }
                const right = {
                    a: [3,
                        null],
                    nested: {
                        alpha: "value",
                        beta: true,
                    },
                    z: 1,
                }

                expect(canonicalizeExecutionJson(left)).toBe(canonicalizeExecutionJson(right))
                expect(executionDigestHex(EXECUTION_DIGEST_DOMAINS.accept,
                    left)).toBe(executionDigestHex(EXECUTION_DIGEST_DOMAINS.accept,
                    right))
            })

        it("separates digest domains and rejects values outside JSON",
            () => {
                const payload = {
                    value: "same",
                }
                expect(executionDigestHex(EXECUTION_DIGEST_DOMAINS.accept,
                    payload)).not.toBe(executionDigestHex(EXECUTION_DIGEST_DOMAINS.terminalPayload,
                    payload))
                expect(() => canonicalizeExecutionJson({
                    value: undefined,
                })).toThrow("undefined")
                expect(() => canonicalizeExecutionJson(undefined)).toThrow("undefined")
                expect(() => canonicalizeExecutionJson(Number.POSITIVE_INFINITY)).toThrow("non-finite")
            })

        it("hashes lease tokens to fixed raw bytes and compares them safely",
            () => {
                const first = digestLeaseToken("opaque-token")
                const replay = digestLeaseToken("opaque-token")
                const different = digestLeaseToken("other-token")

                expect(first).toHaveLength(32)
                expect(executionDigestsEqual(first,
                    replay)).toBe(true)
                expect(executionDigestsEqual(first,
                    different)).toBe(false)
                expect(executionDigestsEqual(first,
                    Buffer.alloc(31))).toBe(false)
            })

        it("formats digest dates with exactly three UTC fractional digits",
            () => {
                expect(canonicalExecutionDate(new Date("2026-08-27T10:11:12.345Z")))
                    .toBe("2026-08-27T10:11:12.345Z")
            })

        it("matches the frozen accept and raw-token vectors",
            () => {
                expect(canonicalizeExecutionJson(digestFixture.accept.payload))
                    .toBe(digestFixture.accept.canonical)
                expect(executionDigestHex(digestFixture.accept.domain,
                    digestFixture.accept.payload)).toBe(digestFixture.accept.sha256)
                expect(digestLeaseToken(digestFixture.leaseToken.base64url).toString("hex"))
                    .toBe(digestFixture.leaseToken.sha256)
            })

        it("rejects lone Unicode surrogates required by I-JSON",
            () => {
                expect(() => canonicalizeExecutionJson("\uD800")).toThrow("surrogates")
                expect(() => canonicalizeExecutionJson({
                    ["\uD800"]: "value",
                })).toThrow("surrogates")
            })
    })
