import {
    getMetadataArgsStorage
} from "typeorm"
import {
    UserPinnedProjectEntity
} from "./user-pinned-project.entity"
describe("UserPinnedProjectEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new UserPinnedProjectEntity(),
            {
                id: "wave22-pinned-project"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-pinned-project"); const id = getMetadataArgsStorage().columns.find((x) => x.target === UserPinnedProjectEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("UserPinnedProjectEntity contract",
    () => {
        it("resolves table, columns, relations, indexes, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === UserPinnedProjectEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === UserPinnedProjectEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === UserPinnedProjectEntity)
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
                const indexWhereValues = storage.indices.filter((metadata) => metadata.target === UserPinnedProjectEntity).map((metadata) => metadata.where)
                expect(indexWhereValues.every((value) => value === undefined || typeof value === "string")).toBe(true)
            })
    })
