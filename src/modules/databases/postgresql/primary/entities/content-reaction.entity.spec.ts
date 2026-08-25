import {
    getMetadataArgsStorage
} from "typeorm"
import {
    ContentReactionEntity
} from "./content-reaction.entity"
describe("ContentReactionEntity contract",
    () => {
        it("resolves table, columns, relations, indexes, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === ContentReactionEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === ContentReactionEntity).length).toBeGreaterThanOrEqual(1)
                const relations = storage.relations.filter((metadata) => metadata.target === ContentReactionEntity)
                expect(relations.length).toBeGreaterThan(0)
                const relationTargets = relations.map((metadata) => {
                    const relationType: unknown = metadata.type
                    return typeof relationType === "function" ? (relationType as () => unknown)() : relationType
                })
                expect(relationTargets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true)
                const indexWhereValues = storage.indices.filter((metadata) => metadata.target === ContentReactionEntity).map((metadata) => {
                    const where: unknown = metadata.where
                    return typeof where === "function" ? (where as () => unknown)() : where
                })
                expect(indexWhereValues.every((value) => value === undefined || typeof value === "string")).toBe(true)
            })
    })
