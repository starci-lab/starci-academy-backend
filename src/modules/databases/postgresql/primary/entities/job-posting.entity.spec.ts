import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    JobPostingEntity 
} from "./job-posting.entity"
describe("JobPostingEntity contract",
    () => { it("maps posting fields and company relation metadata",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === JobPostingEntity)).toBe(true); expect(s.columns.filter((x) => x.target === JobPostingEntity).length).toBeGreaterThan(4); expect(s.relations.some((x) => x.target === JobPostingEntity)).toBe(true) }) })
