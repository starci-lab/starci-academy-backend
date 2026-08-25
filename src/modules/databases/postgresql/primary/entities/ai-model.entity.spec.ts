import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    AiModelEntity 
} from "./ai-model.entity"
describe("AiModelEntity contract",
    () => { it("maps model catalog fields and uniqueness metadata",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === AiModelEntity)).toBe(true); expect(s.columns.filter((x) => x.target === AiModelEntity).length).toBeGreaterThan(6); expect(s.indices.some((x) => x.target === AiModelEntity)).toBe(true) }) })
