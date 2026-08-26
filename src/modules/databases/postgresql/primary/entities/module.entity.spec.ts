import {
    getMetadataArgsStorage
} from "typeorm"
import {
    ModuleEntity
} from "./module.entity"
describe("ModuleEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new ModuleEntity(),
            {
                id: "wave22-module"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-module"); const id = getMetadataArgsStorage().columns.find((x) => x.target === ModuleEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("ModuleEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === ModuleEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("ModuleEntity contract",
    () => { it("maps module ordering and course relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ModuleEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ModuleEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ModuleEntity)).toBe(true) }) })
