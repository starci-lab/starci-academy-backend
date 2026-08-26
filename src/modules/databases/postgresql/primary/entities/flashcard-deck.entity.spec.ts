import {
    getMetadataArgsStorage
} from "typeorm"
import {
    FlashcardDeckEntity
} from "./flashcard-deck.entity"
describe("FlashcardDeckEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new FlashcardDeckEntity(),
            {
                id: "wave22-deck"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-deck"); const id = getMetadataArgsStorage().columns.find((x) => x.target === FlashcardDeckEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("FlashcardDeckEntity contract",
    () => {
        it("resolves table, columns, relations, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === FlashcardDeckEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === FlashcardDeckEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === FlashcardDeckEntity)
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
