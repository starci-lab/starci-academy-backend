import {
    getMetadataArgsStorage
} from "typeorm"
import {
    JobEntity
} from "./job.entity"
describe("JobEntity contract",
    () => {
        it("resolves table, columns, and index where metadata",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === JobEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === JobEntity).length).toBeGreaterThan(4)
                const whereValues = storage.indices.filter((metadata) => metadata.target === JobEntity).map((metadata) => metadata.where)
                expect(whereValues.every((value) => value === undefined || typeof value === "string")).toBe(true)
            })
    })
