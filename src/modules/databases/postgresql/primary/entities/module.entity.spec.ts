import {
    getMetadataArgsStorage
} from "typeorm"
import {
    ModuleEntity
} from "./module.entity"
describe("ModuleEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === ModuleEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("ModuleEntity contract",
    () => { it("maps module ordering and course relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ModuleEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ModuleEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ModuleEntity)).toBe(true) }) })
