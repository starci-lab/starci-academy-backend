import {
    getMetadataArgsStorage
} from "typeorm"
import {
    PlaygroundEntity
} from "./playground.entity"
describe("PlaygroundEntity contract",
    () => {
        it("resolves table, columns, relations, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === PlaygroundEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === PlaygroundEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === PlaygroundEntity)
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
            })
    })
