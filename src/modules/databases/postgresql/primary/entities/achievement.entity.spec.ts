import {
    getMetadataArgsStorage
} from "typeorm"
import {
    AchievementEntity
} from "./achievement.entity"
describe("AchievementEntity contract",
    () => {
        it("resolves table, columns, and index metadata",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === AchievementEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === AchievementEntity).length).toBeGreaterThan(2)
                const whereValues = storage.indices.filter((metadata) => metadata.target === AchievementEntity).map((metadata) => metadata.where)
                expect(whereValues.every((value) => value === undefined || typeof value === "string")).toBe(true)
            })
    })
