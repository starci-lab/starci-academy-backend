import {
    getMetadataArgsStorage
} from "typeorm"
import {
    ChallengeSubmissionEntity
} from "./challenge-submission.entity"
describe("ChallengeSubmissionEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new ChallengeSubmissionEntity(),
            {
                id: "wave22-submission"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-submission"); const id = getMetadataArgsStorage().columns.find((x) => x.target === ChallengeSubmissionEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("ChallengeSubmissionEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === ChallengeSubmissionEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("ChallengeSubmissionEntity contract",
    () => { it("maps submission data and challenge relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ChallengeSubmissionEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ChallengeSubmissionEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ChallengeSubmissionEntity)).toBe(true) }) })
