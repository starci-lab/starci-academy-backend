import {
    segmentFromCdnKey,
    partitionOrphanCdnKeys,
    exceedsPruneRatio,
} from "../utils/reconcile"

describe("reconcile utils",
    () => {
        describe("segmentFromCdnKey",
            () => {
                it("extracts the id from a locale-less key",
                    () => {
                        expect(segmentFromCdnKey("courses/abc-123.json",
                            "courses/")).toBe("abc-123")
                    })

                it("extracts the id from a per-locale key",
                    () => {
                        expect(segmentFromCdnKey("courses/abc-123/vi.json",
                            "courses/")).toBe("abc-123")
                    })

                it("extracts a displayId segment the same way",
                    () => {
                        expect(segmentFromCdnKey("modules/4-server-state/en.json",
                            "modules/")).toBe("4-server-state")
                    })

                it("returns null for a key outside the prefix",
                    () => {
                        expect(segmentFromCdnKey("contents/x.json",
                            "courses/")).toBeNull()
                    })

                it("returns null when there is no segment after the prefix",
                    () => {
                        expect(segmentFromCdnKey("courses/.json",
                            "courses/")).toBeNull()
                    })
            })

        describe("partitionOrphanCdnKeys",
            () => {
                it("flags every key whose id/displayId is not in the live set",
                    () => {
                        const keys = [
                            "courses/live-1.json",
                            "courses/live-1/vi.json",
                            "courses/ghost-9.json",
                            "courses/ghost-9/vi.json",
                            "courses/ghost-9/en.json",
                        ]
                        const live = new Set([
                            "live-1",
                        ])

                        const result = partitionOrphanCdnKeys(keys,
                            "courses/",
                            live)

                        expect(result.orphanKeys.sort()).toEqual([
                            "courses/ghost-9.json",
                            "courses/ghost-9/en.json",
                            "courses/ghost-9/vi.json",
                        ])
                        // 2 distinct segments (live-1, ghost-9), 1 orphaned
                        expect(result.totalSegments).toBe(2)
                        expect(result.orphanSegments).toBe(1)
                    })

                it("keeps a key live when matched by displayId (not just id)",
                    () => {
                        const keys = [
                            "courses/uuid-1.json",
                            "courses/the-shop.json",
                        ]
                        // live set unions ids + displayIds
                        const live = new Set([
                            "uuid-1",
                            "the-shop",
                        ])

                        const result = partitionOrphanCdnKeys(keys,
                            "courses/",
                            live)

                        expect(result.orphanKeys).toEqual([])
                        expect(result.orphanSegments).toBe(0)
                    })

                it("ignores keys outside the prefix",
                    () => {
                        const result = partitionOrphanCdnKeys([
                            "courses/x.json",
                            "unrelated/y.json",
                        ],
                        "courses/",
                        new Set<string>())

                        // only the courses/ key counts; unrelated/ is skipped
                        expect(result.totalSegments).toBe(1)
                        expect(result.orphanKeys).toEqual([
                            "courses/x.json",
                        ])
                    })
            })

        describe("exceedsPruneRatio",
            () => {
                it("is false when nothing is present",
                    () => {
                        expect(exceedsPruneRatio(0,
                            0,
                            0.5)).toBe(false)
                    })

                it("is true when an empty DB would wipe the whole index",
                    () => {
                        // 100 present, all orphaned (DB returned nothing) → 100% > 50%
                        expect(exceedsPruneRatio(100,
                            100,
                            0.5)).toBe(true)
                    })

                it("is false for a small, safe cleanup",
                    () => {
                        // 3 of 100 → 3% well under the cap
                        expect(exceedsPruneRatio(3,
                            100,
                            0.5)).toBe(false)
                    })

                it("is exactly at the boundary (not strictly greater) → allowed",
                    () => {
                        // 50 of 100 == 50%, not > 50% → allowed
                        expect(exceedsPruneRatio(50,
                            100,
                            0.5)).toBe(false)
                    })
            })
    })
