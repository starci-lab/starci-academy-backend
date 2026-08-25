import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    MilestoneTaskEntity 
} from "./milestone-task.entity"
describe("MilestoneTaskEntity contract",
    () => { it("maps task columns and ownership relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === MilestoneTaskEntity)).toBe(true); expect(s.columns.filter((x) => x.target === MilestoneTaskEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === MilestoneTaskEntity)).toBe(true) }) })
