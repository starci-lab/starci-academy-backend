import {
    BloomFilterService 
} from "./bloom-filter.service"

describe("BloomFilterService",
    () => {
        it("adds, checks, serializes and restores values",
            () => {
                const service = new BloomFilterService(); const state = service.create({
                    sizeBits: 64, hashes: 3 
                })
                service.add(state,
                    "alpha"); expect(service.has(state,
                    "alpha")).toBe(true); expect(service.has(state,
                    "definitely-other")).toBe(false)
                const restored = service.fromJSON(service.toJSON(state)); expect(service.has(restored,
                    "alpha")).toBe(true)
            })
        it("normalizes options and recommendations",
            () => {
                const service = new BloomFilterService(); expect(service.create({
                    sizeBits: 0.5, hashes: 0 
                })).toMatchObject({
                    sizeBits: 1, hashes: 1 
                })
                expect(service.recommend(0,
                    2)).toEqual(expect.objectContaining({
                    sizeBits: expect.any(Number), hashes: expect.any(Number) 
                }))
            })
    })
