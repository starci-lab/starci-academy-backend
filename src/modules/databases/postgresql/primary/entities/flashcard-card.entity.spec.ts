import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    FlashcardCardEntity 
} from "./flashcard-card.entity"
describe("FlashcardCardEntity contract",
    () => { it("maps card prompt/answer fields and deck relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === FlashcardCardEntity)).toBe(true); expect(s.columns.filter((x) => x.target === FlashcardCardEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === FlashcardCardEntity)).toBe(true) }) })
