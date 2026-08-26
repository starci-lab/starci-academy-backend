import {
    AchievementCriteriaType
} from "@modules/databases/postgresql/primary/enums/achievement-criteria-type"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MyAchievementsResolver
} from "./my-achievements.resolver"

describe("MyAchievementsResolver",
    () => {
        const achievement = {
            slug: "first-lesson",
            name: {
                en: "First lesson",
                vi: "First lesson (localized)",
            },
            description: {
                en: "Read one lesson",
                vi: "Read one lesson (localized)",
            },
            iconKey: "badges/first-lesson.svg",
            criteriaType: AchievementCriteriaType.LessonsRead,
            threshold: 1,
            earned: true,
            earnedAt: new Date("2026-01-02T00:00:00.000Z"),
            currentValue: 3,
            tierReached: 1,
            rarityPercent: 12.5,
        }

        it("localizes both achievement lists for Vietnamese viewers",
            async () => {
                const getMyAchievements = jest.fn().mockResolvedValue({
                    data: [achievement],
                    count: 1,
                    newAchievements: [achievement],
                })
                const resolver = new MyAchievementsResolver({
                    getMyAchievements
                } as never)

                await expect(resolver.execute(Locale.Vi,
{
    id: "user-1"
} as never)).resolves.toEqual({
                    data: [{
                        ...achievement,
                        name: "First lesson (localized)",
                        description: "Read one lesson (localized)",
                    }],
                    count: 1,
                    newAchievements: [{
                        ...achievement,
                        name: "First lesson (localized)",
                        description: "Read one lesson (localized)",
                    }],
                })
                expect(getMyAchievements).toHaveBeenCalledWith("user-1")
            })

        it("uses English for non-Vietnamese locale and preserves empty subsets",
            async () => {
                const getMyAchievements = jest.fn().mockResolvedValue({
                    data: [achievement],
                    count: 1,
                    newAchievements: [],
                })
                const resolver = new MyAchievementsResolver({
                    getMyAchievements
                } as never)

                await expect(resolver.execute(Locale.En,
{
    id: "user-2"
} as never)).resolves.toEqual({
                    data: [{
                        ...achievement,
                        name: "First lesson",
                        description: "Read one lesson",
                    }],
                    count: 1,
                    newAchievements: [],
                })
            })

        it("propagates achievement service failures",
            async () => {
                const failure = new Error("achievement service unavailable")
                const getMyAchievements = jest.fn().mockRejectedValue(failure)
                const resolver = new MyAchievementsResolver({
                    getMyAchievements
                } as never)

                await expect(resolver.execute(Locale.En,
{
    id: "user-3"
} as never)).rejects.toBe(failure)
            })
    })
