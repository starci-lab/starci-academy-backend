import {
    getMetadataArgsStorage
} from "typeorm"
import {
    ChallengeSubmissionEntity
} from "./challenge-submission.entity"
describe("ChallengeSubmissionEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === ChallengeSubmissionEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("ChallengeSubmissionEntity contract",
    () => { it("maps submission data and challenge relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ChallengeSubmissionEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ChallengeSubmissionEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ChallengeSubmissionEntity)).toBe(true) }) })
