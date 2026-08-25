import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    TransactionEntity 
} from "./transaction.entity"
describe("TransactionEntity contract",
    () => { it("maps payment identity and status columns",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === TransactionEntity)).toBe(true); expect(s.columns.filter((x) => x.target === TransactionEntity).length).toBeGreaterThan(4); expect(s.indices.some((x) => x.target === TransactionEntity)).toBe(true) }) })
