import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    ChallengeEntity 
} from "./challenge.entity"
describe("ChallengeEntity contract",
    () => { it("maps challenge fields and child relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ChallengeEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ChallengeEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ChallengeEntity)).toBe(true) }) })
