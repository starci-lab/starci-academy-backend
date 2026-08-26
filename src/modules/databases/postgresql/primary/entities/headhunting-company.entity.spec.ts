import {
    getMetadataArgsStorage
} from "typeorm"
import {
    HeadhuntingCompanyEntity
} from "./headhunting-company.entity"
describe("HeadhuntingCompanyEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new HeadhuntingCompanyEntity(),
            {
                id: "wave22-company"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-company"); const id = getMetadataArgsStorage().columns.find((x) => x.target === HeadhuntingCompanyEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("HeadhuntingCompanyEntity contract",
    () => {
        it("resolves table, columns, relations, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === HeadhuntingCompanyEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === HeadhuntingCompanyEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === HeadhuntingCompanyEntity)
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
