import {
    getMetadataArgsStorage
} from "typeorm"
import {
    UserEntity
} from "./user.entity"
describe("UserEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === UserEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("UserEntity contract",
    () => { it("maps the user table with identity columns and relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === UserEntity)).toBe(true); expect(s.columns.filter((x) => x.target === UserEntity).length).toBeGreaterThan(5); expect(s.relations.some((x) => x.target === UserEntity)).toBe(true) }) })
