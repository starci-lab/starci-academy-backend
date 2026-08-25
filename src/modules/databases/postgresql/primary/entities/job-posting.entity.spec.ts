import {
    getMetadataArgsStorage
} from "typeorm"
import {
    JobPostingEntity
} from "./job-posting.entity"
describe("JobPostingEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === JobPostingEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("JobPostingEntity contract",
    () => { it("maps posting fields and company relation metadata",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === JobPostingEntity)).toBe(true); expect(s.columns.filter((x) => x.target === JobPostingEntity).length).toBeGreaterThan(4); expect(s.relations.some((x) => x.target === JobPostingEntity)).toBe(true) }) })
