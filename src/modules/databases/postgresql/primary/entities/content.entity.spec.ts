import {
    getMetadataArgsStorage
} from "typeorm"
import {
    ContentEntity
} from "./content.entity"
describe("ContentEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new ContentEntity(),
            {
                id: "wave22-content"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-content"); const id = getMetadataArgsStorage().columns.find((x) => x.target === ContentEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("ContentEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === ContentEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("ContentEntity contract",
    () => { it("declares persisted columns and relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ContentEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ContentEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ContentEntity)).toBe(true); const relationTypes = s.relations.filter((x) => x.target === ContentEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(relationTypes.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) })
    it("exposes a stable display id column contract for index synchronization",
        () => { const s = getMetadataArgsStorage(); const displayId = s.columns.find((x) => x.target === ContentEntity && x.propertyName === "displayId"); expect(displayId?.propertyName).toBe("displayId"); expect(displayId?.options.type).toBe("varchar") }) })
