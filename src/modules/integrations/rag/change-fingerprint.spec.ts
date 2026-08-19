import {
    Document,
} from "@langchain/core/documents"
import * as changeFingerprintModule from "./change-fingerprint"
import {
    asStoredChangeFingerprint,
    CHANGE_FINGERPRINT_METADATA_KEY,
    computeChangeFingerprint,
} from "./change-fingerprint"

const buildDocs = (
    contents: Array<string>,
): Array<Document> => contents.map((pageContent) => new Document({
    pageContent,
    metadata: {
    },
}))

describe("change-fingerprint",
    () => {
        describe("computeChangeFingerprint",
            () => {
                it("pins: identical source text -> identical fingerprint (this is what lets a diff-aware index build skip re-embedding)",
                    () => {
                        const before = computeChangeFingerprint(buildDocs([
                            "hello",
                            "world",
                        ]))
                        const again = computeChangeFingerprint(buildDocs([
                            "hello",
                            "world",
                        ]))
                        expect(again).toBe(before)
                    })

                it("pins: changed source text -> different fingerprint (this is what forces a diff-aware index build to re-embed)",
                    () => {
                        const before = computeChangeFingerprint(buildDocs([
                            "hello",
                            "world",
                        ]))
                        const after = computeChangeFingerprint(buildDocs([
                            "hello",
                            "there",
                        ]))
                        expect(after).not.toBe(before)
                    })

                it("returns a sha1 hex digest shape (lowercase, 40 hex chars)",
                    () => {
                        const fingerprint = computeChangeFingerprint(buildDocs([
                            "anything",
                        ]))
                        expect(fingerprint).toMatch(/^[0-9a-f]{40}$/)
                    })
            })

        describe("asStoredChangeFingerprint",
            () => {
                it("narrows a stored string value into a fingerprint",
                    () => {
                        expect(asStoredChangeFingerprint("deadbeef")).toBe("deadbeef")
                    })

                it.each([
                    undefined,
                    null,
                    42,
                    {
                    },
                    [],
                    true,
                ])("returns undefined for a non-string payload value (%p) -- a malformed/hand-edited point must never silently compare as a match",
                    (value) => {
                        expect(asStoredChangeFingerprint(value)).toBeUndefined()
                    })

                it("round-trips a value minted by computeChangeFingerprint",
                    () => {
                        const minted = computeChangeFingerprint(buildDocs([
                            "roundtrip",
                        ]))
                        expect(asStoredChangeFingerprint(minted)).toBe(minted)
                    })
            })

        describe("CHANGE_FINGERPRINT_METADATA_KEY (persisted wire key)",
            () => {
                it("stays exactly \"sourceHash\" -- already persisted on every point in content_rag/cv_rag; renaming it orphans every stored fingerprint and forces a full corpus re-embed",
                    () => {
                        expect(CHANGE_FINGERPRINT_METADATA_KEY).toBe("sourceHash")
                    })
            })

        describe("hardened naming boundary",
            () => {
                it("exposes the change-detection API under exactly its hardened names -- a rename back to `hashDocs`/losing a name here changes this exported-key set and must fail this test",
                    () => {
                        expect(typeof changeFingerprintModule.computeChangeFingerprint).toBe("function")
                        expect(typeof changeFingerprintModule.asStoredChangeFingerprint).toBe("function")
                        expect(typeof CHANGE_FINGERPRINT_METADATA_KEY).toBe("string")

                        // Exact runtime export surface (type-only exports like
                        // `ChangeFingerprint` are erased and never appear here).
                        // A rename back to `hashDocs`, or any other drift in the
                        // exported name set, changes this list and fails the test.
                        expect(Object.keys(changeFingerprintModule).sort()).toEqual([
                            "CHANGE_FINGERPRINT_METADATA_KEY",
                            "asStoredChangeFingerprint",
                            "computeChangeFingerprint",
                        ])
                    })
            })
    })
