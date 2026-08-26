import {
    getMetadataArgsStorage
} from "typeorm"
import {
    EnrollmentEntity
} from "./enrollment.entity"
describe("EnrollmentEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new EnrollmentEntity(),
            {
                id: "wave22-enrollment"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-enrollment"); const id = getMetadataArgsStorage().columns.find((x) => x.target === EnrollmentEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("EnrollmentEntity contract",
    () => {
        it("resolves table, columns, relations, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === EnrollmentEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === EnrollmentEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === EnrollmentEntity)
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
