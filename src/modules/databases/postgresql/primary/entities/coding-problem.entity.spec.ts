import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    CodingProblemEntity 
} from "./coding-problem.entity"
describe("CodingProblemEntity contract",
    () => { it("maps problem columns and relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === CodingProblemEntity)).toBe(true); expect(s.columns.filter((x) => x.target === CodingProblemEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === CodingProblemEntity)).toBe(true) }) })
