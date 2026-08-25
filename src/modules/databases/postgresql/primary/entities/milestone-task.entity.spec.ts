import {
    getMetadataArgsStorage
} from "typeorm"
import {
    MilestoneTaskEntity
} from "./milestone-task.entity"
describe("MilestoneTaskEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === MilestoneTaskEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("MilestoneTaskEntity contract",
    () => { it("maps task columns and ownership relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === MilestoneTaskEntity)).toBe(true); expect(s.columns.filter((x) => x.target === MilestoneTaskEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === MilestoneTaskEntity)).toBe(true) }) })
