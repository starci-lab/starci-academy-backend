import {
    getMetadataArgsStorage
} from "typeorm"
import {
    FoundationEntity
} from "./foundation.entity"
describe("FoundationEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === FoundationEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("FoundationEntity contract",
    () => { it("maps foundation fields and category relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === FoundationEntity)).toBe(true); expect(s.columns.filter((x) => x.target === FoundationEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === FoundationEntity)).toBe(true) }) })
