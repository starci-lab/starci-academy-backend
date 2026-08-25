import {
    getMetadataArgsStorage
} from "typeorm"
import {
    ChallengeEntity
} from "./challenge.entity"
describe("ChallengeEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === ChallengeEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("ChallengeEntity contract",
    () => { it("maps challenge fields and child relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ChallengeEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ChallengeEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ChallengeEntity)).toBe(true) }) })
