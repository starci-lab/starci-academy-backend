import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    FoundationEntity 
} from "./foundation.entity"
describe("FoundationEntity contract",
    () => { it("maps foundation fields and category relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === FoundationEntity)).toBe(true); expect(s.columns.filter((x) => x.target === FoundationEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === FoundationEntity)).toBe(true) }) })
