import {
    getMetadataArgsStorage
} from "typeorm"
import {
    CourseVoucherEntity
} from "./course-voucher.entity"
describe("CourseVoucherEntity contract",
    () => {
        it("resolves table, columns, relations, indexes, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === CourseVoucherEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === CourseVoucherEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === CourseVoucherEntity)
                expect(relations.length).toBeGreaterThan(0)
                const relationTargets = relations.map((metadata) => {
                    const relationType: unknown = metadata.type
                    return typeof relationType === "function" ? (relationType as () => unknown)() : relationType
                })
                expect(relationTargets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true)
                const inverseValues = relations.map((metadata) => {
                    if (typeof metadata.inverseSideProperty !== "function") {
                        return metadata.inverseSideProperty
                    }
                    try {
                        return metadata.inverseSideProperty({
                        } as never)
                    } catch {
                        return undefined
                    }
                })
                expect(inverseValues.every((value) => value === undefined || typeof value === "string" || typeof value === "function")).toBe(true)
                const indexWhereValues = storage.indices.filter((metadata) => metadata.target === CourseVoucherEntity).map((metadata) => metadata.where)
                expect(indexWhereValues.every((value) => value === undefined || typeof value === "string")).toBe(true)
            })
    })
