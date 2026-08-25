import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    UserEntity 
} from "./user.entity"
describe("UserEntity contract",
    () => { it("maps the user table with identity columns and relations",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === UserEntity)).toBe(true); expect(s.columns.filter((x) => x.target === UserEntity).length).toBeGreaterThan(5); expect(s.relations.some((x) => x.target === UserEntity)).toBe(true) }) })
