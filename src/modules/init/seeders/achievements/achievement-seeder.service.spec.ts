import {
    AchievementSeederService
} from "./achievement-seeder.service"
import {
    existsSync,
    readFileSync,
} from "node:fs"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem/utils/mount-seed"
import {
    AchievementCriteriaType,
} from "@modules/databases/postgresql/primary/enums/achievement-criteria-type"

jest.mock("node:fs",
    () => {
        const actual = jest.requireActual<typeof import("node:fs")>("node:fs")
        return {
            ...actual,
            existsSync: jest.fn(),
            readFileSync: jest.fn(),
        }
    })
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))
jest.mock("@modules/filesystem/utils/mount-seed",
    () => ({
        getRuntimeContextRoot: jest.fn(),
    }))

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

        it("resolves the mount file, skips invalid criteria, and upserts tiered definitions",
            async () => {
                const upsert = jest.fn().mockResolvedValue(undefined)
                const extract = jest.fn().mockReturnValue({
                    data: [
                        {
                            slug: "ignored",
                            criteriaType: "unknown",
                        },
                        {
                            slug: "busy-bee",
                            name: {
                                en: "Busy Bee",
                            },
                            description: {
                                en: "Earn points",
                            },
                            criteriaType: AchievementCriteriaType.LessonsRead,
                            threshold: "5",
                            tierThresholds: "10, 25, invalid",
                            sortIndex: "2",
                        },
                    ],
                })
                const coerce = {
                    toNullableEnum: jest.fn((value: unknown) =>
                        value === AchievementCriteriaType.LessonsRead ? AchievementCriteriaType.LessonsRead : null),
                    toRequiredString: jest.fn((value: unknown, fallback: string) =>
                        typeof value === "string" ? value : fallback),
                    toRequiredNumber: jest.fn((value: unknown, fallback: number) =>
                        typeof value === "string" ? Number(value) : fallback),
                }
                jest.mocked(envConfig).mockReturnValue({
                    mountPath: {
                        data: {
                            achievements: "C:/mount/data/achievements",
                        },
                    },
                } as ReturnType<typeof envConfig>)
                jest.mocked(getRuntimeContextRoot).mockReturnValue(undefined)
                jest.mocked(existsSync).mockReturnValue(true)
                jest.mocked(readFileSync).mockReturnValue("# 0" as never)

                const service = new AchievementSeederService({
                    upsert,
                } as never,
                    {
                        isAchievementsSeederEnabled: jest.fn().mockReturnValue(true),
                    } as never,
                    {
                        extract,
                    } as never,
                    coerce as never)

                await service.seed()

                expect(readFileSync).toHaveBeenCalled()
                expect(extract).toHaveBeenCalledWith("# 0")
                expect(upsert).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        slug: "busy-bee",
                        criteriaType: AchievementCriteriaType.LessonsRead,
                        threshold: 5,
                        tierThresholds: [10,
                            25],
                        iconKey: "assets/badges/achievements/busy-bee.png",
                        sortIndex: 2,
                    }),
                    ["slug"])
                expect(upsert).toHaveBeenCalledTimes(1)
            })
    })
