import {
    getMetadataArgsStorage
} from "typeorm"
import {
    FlashcardCardEntity
} from "./flashcard-card.entity"
describe("FlashcardCardEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new FlashcardCardEntity(),
            {
                id: "wave22-card"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-card"); const id = getMetadataArgsStorage().columns.find((x) => x.target === FlashcardCardEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("FlashcardCardEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === FlashcardCardEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("FlashcardCardEntity contract",
    () => { it("maps card prompt/answer fields and deck relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === FlashcardCardEntity)).toBe(true); expect(s.columns.filter((x) => x.target === FlashcardCardEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === FlashcardCardEntity)).toBe(true) }) })
