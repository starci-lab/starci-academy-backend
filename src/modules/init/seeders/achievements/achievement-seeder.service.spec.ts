import {
    AchievementSeederService
} from "./achievement-seeder.service"

describe("AchievementSeederService",
    () => {
        it("honors the disabled seeder gate",
            async () => {
                const upsert = jest.fn()
                const service = new AchievementSeederService({
                    upsert
                } as never,
{
    isAchievementsSeederEnabled: jest.fn().mockReturnValue(false)
} as never,
{
} as never,
{
} as never)
                await expect(service.seed()).resolves.toBeUndefined()
                expect(upsert).not.toHaveBeenCalled()
            })
    })
