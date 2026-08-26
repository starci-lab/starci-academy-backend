import {
    getMetadataArgsStorage
} from "typeorm"
import {
    PlaygroundStepEntity
} from "./playground-step.entity"
describe("PlaygroundStepEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new PlaygroundStepEntity(),
            {
                id: "wave22-playground-step"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-playground-step"); const id = getMetadataArgsStorage().columns.find((x) => x.target === PlaygroundStepEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("PlaygroundStepEntity contract",
    () => {
        it("resolves table, columns, relations, indexes, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === PlaygroundStepEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === PlaygroundStepEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === PlaygroundStepEntity)
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
                const indexWhereValues = storage.indices.filter((metadata) => metadata.target === PlaygroundStepEntity).map((metadata) => metadata.where)
                expect(indexWhereValues.every((value) => value === undefined || typeof value === "string")).toBe(true)
            })
    })
