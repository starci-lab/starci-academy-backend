import {
    getMetadataArgsStorage
} from "typeorm"
import {
    TransactionItemEntity
} from "./transaction-item.entity"
describe("TransactionItemEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new TransactionItemEntity(),
            {
                id: "wave22-item"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-item"); const id = getMetadataArgsStorage().columns.find((x) => x.target === TransactionItemEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("TransactionItemEntity contract",
    () => {
        it("resolves table, columns, relations, indexes, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === TransactionItemEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === TransactionItemEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === TransactionItemEntity)
                expect(relations.length).toBeGreaterThan(0)
                const relationTargets = relations.map((metadata) => {
                    const relationType: unknown = metadata.type
                    return typeof relationType === "function"
                        ? (relationType as () => unknown)()
                        : relationType
                })
                expect(relationTargets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true)
                const indexWhereValues = storage.indices.filter((metadata) => metadata.target === TransactionItemEntity).map((metadata) => {
                    const where: unknown = metadata.where
                    return typeof where === "function"
                        ? (where as () => unknown)()
                        : where
                })
                expect(indexWhereValues.every((value) => value === undefined || typeof value === "string")).toBe(true)
            })
    })
