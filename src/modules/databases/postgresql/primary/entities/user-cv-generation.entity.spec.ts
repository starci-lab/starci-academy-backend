import {
    getMetadataArgsStorage
} from "typeorm"
import {
    UserCvGenerationEntity
} from "./user-cv-generation.entity"
describe("UserCvGenerationEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === UserCvGenerationEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("UserCvGenerationEntity contract",
    () => { it("maps generation lifecycle fields and user relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === UserCvGenerationEntity)).toBe(true); expect(s.columns.filter((x) => x.target === UserCvGenerationEntity).length).toBeGreaterThan(4); expect(s.relations.some((x) => x.target === UserCvGenerationEntity)).toBe(true) }) })
