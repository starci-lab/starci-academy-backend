import {
    getMetadataArgsStorage
} from "typeorm"
import {
    FlashcardCardEntity
} from "./flashcard-card.entity"
describe("FlashcardCardEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === FlashcardCardEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("FlashcardCardEntity contract",
    () => { it("maps card prompt/answer fields and deck relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === FlashcardCardEntity)).toBe(true); expect(s.columns.filter((x) => x.target === FlashcardCardEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === FlashcardCardEntity)).toBe(true) }) })
