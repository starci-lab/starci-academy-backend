import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    ChallengeSubmissionEntity 
} from "./challenge-submission.entity"
describe("ChallengeSubmissionEntity contract",
    () => { it("maps submission data and challenge relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ChallengeSubmissionEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ChallengeSubmissionEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ChallengeSubmissionEntity)).toBe(true) }) })
