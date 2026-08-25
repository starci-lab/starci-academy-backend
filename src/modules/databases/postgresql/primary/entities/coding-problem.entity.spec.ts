import {
    getMetadataArgsStorage
} from "typeorm"
import {
    CodingProblemEntity
} from "./coding-problem.entity"
describe("CodingProblemEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === CodingProblemEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("CodingProblemEntity contract",
    () => { it("maps problem columns and relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === CodingProblemEntity)).toBe(true); expect(s.columns.filter((x) => x.target === CodingProblemEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === CodingProblemEntity)).toBe(true) }) })
