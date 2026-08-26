import {
    estimateMemoryUsage, estimateMapMemory, estimateSetMemory, estimateArrayMemory, estimateObjectMemory
} from "./size"
describe("size utilities",
    () => {
        it("estimates primitives and collection branches",
            () => {
                expect(estimateMemoryUsage({
                    a: 1
                })).toContain("KB")
                expect(estimateMemoryUsage(new Map([["a",
                    1]]))).toContain("KB")
                expect(estimateMemoryUsage(new Set(["a"]))).toContain("KB")
                expect(estimateMemoryUsage([1,
                    2])).toContain("KB")
                expect(estimateMapMemory(new Map())).toBeGreaterThanOrEqual(2)
                expect(estimateSetMemory(new Set())).toBeGreaterThanOrEqual(2)
                expect(estimateArrayMemory([])).toBe(2)
                expect(estimateObjectMemory({
                })).toBe(2)
            })
    })
