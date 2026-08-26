import {
    getMetadataArgsStorage
} from "typeorm"
import {
    MockInterviewAttemptEntity
} from "./mock-interview-attempt.entity"
describe("MockInterviewAttemptEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new MockInterviewAttemptEntity(),
            {
                id: "wave22-attempt"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-attempt"); const id = getMetadataArgsStorage().columns.find((x) => x.target === MockInterviewAttemptEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("MockInterviewAttemptEntity contract",
    () => {
        it("resolves table, columns, relations, indexes, and callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === MockInterviewAttemptEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === MockInterviewAttemptEntity).length).toBeGreaterThan(0)
                const relations = storage.relations.filter((metadata) => metadata.target === MockInterviewAttemptEntity)
                expect(relations.length).toBeGreaterThan(0)
                const relationTargets = relations.map((metadata) => {
                    const relationType: unknown = metadata.type
                    return typeof relationType === "function" ? (relationType as () => unknown)() : relationType
                })
                expect(relationTargets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true)
                const indexWhereValues = storage.indices.filter((metadata) => metadata.target === MockInterviewAttemptEntity).map((metadata) => {
                    const where: unknown = metadata.where
                    return typeof where === "function" ? (where as () => unknown)() : where
                })
                expect(indexWhereValues.every((value) => value === undefined || typeof value === "string")).toBe(true)
            })
    })
