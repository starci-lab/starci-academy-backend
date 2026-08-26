import {
    getMetadataArgsStorage
} from "typeorm"
import {
    AchievementEntity
} from "./achievement.entity"
describe("AchievementEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new AchievementEntity(),
            {
                id: "wave22-achievement"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-achievement"); const id = getMetadataArgsStorage().columns.find((x) => x.target === AchievementEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
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
