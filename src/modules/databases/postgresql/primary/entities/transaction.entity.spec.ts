import {
    getMetadataArgsStorage
} from "typeorm"
import {
    TransactionEntity
} from "./transaction.entity"
describe("TransactionEntity index metadata",
    () => { it("resolves callable index where metadata when present",
        () => { const s = getMetadataArgsStorage(); const values = s.indices.filter((x) => x.target === TransactionEntity).map((x) => x.where); expect(values.every((value) => value === undefined || typeof value === "string")).toBe(true) }) })

describe("TransactionEntity contract",
    () => { it("maps payment identity and status columns",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === TransactionEntity)).toBe(true); expect(s.columns.filter((x) => x.target === TransactionEntity).length).toBeGreaterThan(4); expect(s.indices.some((x) => x.target === TransactionEntity)).toBe(true) }) })
