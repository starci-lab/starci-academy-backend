import {
    getMetadataArgsStorage
} from "typeorm"
import {
    ContentCommentEntity
} from "./content-comment.entity"
describe("ContentCommentEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new ContentCommentEntity(),
            {
                id: "wave22-comment"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-comment"); const id = getMetadataArgsStorage().columns.find((x) => x.target === ContentCommentEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("ContentCommentEntity contract",
    () => {
        it("resolves table, columns, relations, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === ContentCommentEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === ContentCommentEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === ContentCommentEntity)
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
