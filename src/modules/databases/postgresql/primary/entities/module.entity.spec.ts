import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    ModuleEntity 
} from "./module.entity"
describe("ModuleEntity contract",
    () => { it("maps module ordering and course relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ModuleEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ModuleEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ModuleEntity)).toBe(true) }) })
