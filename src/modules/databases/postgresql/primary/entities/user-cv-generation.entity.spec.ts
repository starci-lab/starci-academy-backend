import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    UserCvGenerationEntity 
} from "./user-cv-generation.entity"
describe("UserCvGenerationEntity contract",
    () => { it("maps generation lifecycle fields and user relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === UserCvGenerationEntity)).toBe(true); expect(s.columns.filter((x) => x.target === UserCvGenerationEntity).length).toBeGreaterThan(4); expect(s.relations.some((x) => x.target === UserCvGenerationEntity)).toBe(true) }) })
