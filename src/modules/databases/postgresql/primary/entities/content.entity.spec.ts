import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    ContentEntity 
} from "./content.entity"
describe("ContentEntity contract",
    () => { it("declares persisted columns and relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === ContentEntity)).toBe(true); expect(s.columns.filter((x) => x.target === ContentEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === ContentEntity)).toBe(true) }) })
