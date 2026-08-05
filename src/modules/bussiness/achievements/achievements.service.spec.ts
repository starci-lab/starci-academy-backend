import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    AchievementsService,
} from "./achievements.service"
import {
    AbstractBadge,
} from "./badges/abstract-badge"
import {
    ACHIEVEMENT_BADGES,
} from "./badges"
import {
    AchievementEntity,
} from "@modules/databases/postgresql/primary/entities/achievement.entity"
import {
    UserAchievementEntity,
} from "@modules/databases/postgresql/primary/entities/user-achievement.entity"
import {
    AchievementCriteriaType,
} from "@modules/databases/postgresql/primary/enums/achievement-criteria-type"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

/** Params for the local `build` test helper (wires a SUT with programmed badges/definitions/rows). */
interface BuildParams {
    badges: Array<AbstractBadge>
    definitions: Array<AchievementEntity>
    earned?: Array<UserAchievementEntity>
    // each badge's metric value, in the badges' order (-> v0, v1, ...)
    values: Array<number>
    inserted?: boolean
}

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The user under test -- value is irrelevant; it is only threaded into params. */
const USER_ID = "user-1"

/** A stand-in badge: a fixed slug + a no-op scalar query (the value is mocked). */
class FakeBadge extends AbstractBadge {
    constructor(public readonly slug: string) {
        super()
    }

    getSql(): string {
        return "(SELECT 0)"
    }
}

/** Build a definition row keyed to a badge slug, single-tier by default. */
const buildDefinition = (
    overrides: Partial<AchievementEntity> = {
    },
): AchievementEntity => ({
    id: "def-busy-bee",
    slug: "busy-bee",
    name: {
        en: "Busy Bee",
        vi: "Ong Chăm Chỉ", // vn-ok: vi-locale string emitted to clients
    },
    description: {
        en: "Gain 5 followers.",
        vi: "Có 5 người theo dõi.", // vn-ok: vi-locale string emitted to clients
    },
    iconKey: "assets/badges/achievements/busy-bee.png",
    criteriaType: AchievementCriteriaType.Followers,
    threshold: 5,
    tierThresholds: null,
    sortIndex: 0,
    ...overrides,
} as AchievementEntity)

/** True when a raw SQL string is the idempotent award INSERT (vs the composite SELECT). */
const isAwardInsert = (sql: unknown): boolean =>
    String(sql).includes("INSERT INTO user_achievements")

describe("AchievementsService",
    () => {
        let entityManager: EntityManagerMock

        /**
     * Build the SUT wired with the given badges + entity-manager programming.
     * - `find` returns definitions for {@link AchievementEntity}, else the earned ledger.
     * - `query` returns the composite values row for the SELECT, or the insert result
     *   for the award INSERT (defaults to "a row was created").
     */
        const build = async (
            {
                badges,
                definitions,
                earned = [],
                values,
                inserted = true,
            }: BuildParams,
        ): Promise<AchievementsService> => {
            entityManager = makeEntityManagerMock()
            entityManager.find.mockImplementation(async (entity: unknown) =>
                (entity === AchievementEntity ? definitions : earned))
            // composite row: { v0, v1, ... } in badges order
            const row = Object.fromEntries(values.map((value, index) => [`v${index}`,
                String(value)]))
            entityManager.query.mockImplementation(async (sql: unknown) =>
                (isAwardInsert(sql) ? (inserted ? [{
                    id: "award-1" 
                }] : []) : [row]))

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    AchievementsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: ACHIEVEMENT_BADGES,
                        useValue: badges,
                    },
                ],
            }).compile()
            return module.get(AchievementsService)
        }

        /** The `[sql, params]` of every award INSERT the SUT issued. */
        const awardInserts = (): Array<[unknown, Array<unknown>]> =>
        entityManager.query.mock.calls.filter(
            (call) => isAwardInsert(call[0]),
        ) as Array<[unknown, Array<unknown>]>

        describe("recomputeForUser",
            () => {
                it("awards a single-tier badge once its value reaches the threshold",
                    async () => {
                        const service = await build({
                            badges: [
                                new FakeBadge("busy-bee"),
                            ],
                            definitions: [
                                buildDefinition({
                                    threshold: 5,
                                }),
                            ],
                            values: [
                                7,
                            ],
                        })

                        const earned = await service.recomputeForUser({
                            userId: USER_ID,
                        })

                        expect(earned).toEqual([
                            {
                                slug: "busy-bee",
                                tier: null,
                            },
                        ])
                        const inserts = awardInserts()
                        expect(inserts).toHaveLength(1)
                        // params: [userId, achievementId, tier]
                        expect(inserts[0][1]).toEqual([
                            USER_ID,
                            "def-busy-bee",
                            null,
                        ])
                    })

                it("does NOT award when the value is below the threshold",
                    async () => {
                        const service = await build({
                            badges: [
                                new FakeBadge("busy-bee"),
                            ],
                            definitions: [
                                buildDefinition({
                                    threshold: 5,
                                }),
                            ],
                            values: [
                                3,
                            ],
                        })

                        const earned = await service.recomputeForUser({
                            userId: USER_ID,
                        })

                        expect(earned).toEqual([])
                        expect(awardInserts()).toHaveLength(0)
                    })

                it("awards one row per reached tier for a tiered badge",
                    async () => {
                        const service = await build({
                            badges: [
                                new FakeBadge("sword-shark"),
                            ],
                            definitions: [
                                buildDefinition({
                                    id: "def-sword-shark",
                                    slug: "sword-shark",
                                    threshold: 10,
                                    tierThresholds: [
                                        10,
                                        25,
                                        50,
                                    ],
                                }),
                            ],
                            // 30 clears tier 1 (10) and tier 2 (25) but not tier 3 (50)
                            values: [
                                30,
                            ],
                        })

                        const earned = await service.recomputeForUser({
                            userId: USER_ID,
                        })

                        expect(earned).toEqual([
                            {
                                slug: "sword-shark",
                                tier: 1,
                            },
                            {
                                slug: "sword-shark",
                                tier: 2,
                            },
                        ])
                        expect(awardInserts()).toHaveLength(2)
                    })

                it("is idempotent — an already-existing award is not reported as newly earned",
                    async () => {
                        const service = await build({
                            badges: [
                                new FakeBadge("busy-bee"),
                            ],
                            definitions: [
                                buildDefinition({
                                    threshold: 5,
                                }),
                            ],
                            values: [
                                9,
                            ],
                            // INSERT ... WHERE NOT EXISTS suppressed the row -> no id returned
                            inserted: false,
                        })

                        const earned = await service.recomputeForUser({
                            userId: USER_ID,
                        })

                        expect(earned).toEqual([])
                        // the INSERT still runs (idempotent guard), but nothing was created
                        expect(awardInserts()).toHaveLength(1)
                    })

                it("skips a badge with no seeded definition (slug mismatch)",
                    async () => {
                        const service = await build({
                            badges: [
                                new FakeBadge("ghost-badge"),
                            ],
                            definitions: [
                                buildDefinition(),
                            ],
                            values: [
                                99,
                            ],
                        })

                        const earned = await service.recomputeForUser({
                            userId: USER_ID,
                        })

                        expect(earned).toEqual([])
                        expect(awardInserts()).toHaveLength(0)
                    })
            })

        describe("getMyAchievements",
            () => {
                it("returns the list with live values + the newly-earned subset",
                    async () => {
                        const service = await build({
                            badges: [
                                new FakeBadge("busy-bee"),
                                new FakeBadge("brainy-octopus"),
                            ],
                            definitions: [
                                buildDefinition({
                                    id: "def-busy-bee",
                                    slug: "busy-bee",
                                    threshold: 5,
                                }),
                                buildDefinition({
                                    id: "def-brainy-octopus",
                                    slug: "brainy-octopus",
                                    threshold: 3,
                                }),
                            ],
                            // busy-bee=7 (earns, threshold 5), brainy-octopus=1 (no, threshold 3)
                            values: [
                                7,
                                1,
                            ],
                        })

                        const result = await service.getMyAchievements(USER_ID)

                        expect(result.data).toHaveLength(2)
                        // currentValue comes from the composite query, by slug
                        expect(result.data[0]).toMatchObject({
                            slug: "busy-bee",
                            currentValue: 7,
                        })
                        expect(result.data[1]).toMatchObject({
                            slug: "brainy-octopus",
                            currentValue: 1,
                        })
                        // only busy-bee crossed its bar this read -> congratulate it
                        expect(result.newAchievements.map((item) => item.slug)).toEqual([
                            "busy-bee",
                        ])
                    })

                it("flags earned + highest tier from the award ledger, no new when already earned",
                    async () => {
                        const now = new Date("2026-06-15T00:00:00.000Z")
                        const service = await build({
                            badges: [
                                new FakeBadge("sword-shark"),
                            ],
                            definitions: [
                                buildDefinition({
                                    id: "def-sword-shark",
                                    slug: "sword-shark",
                                    threshold: 10,
                                    tierThresholds: [
                                        10,
                                        25,
                                        50,
                                    ],
                                }),
                            ],
                            values: [
                                30,
                            ],
                            // already holds tiers 1 + 2 -> nothing newly inserted
                            earned: [
                    {
                        achievementId: "def-sword-shark",
                        tier: 1,
                        earnedAt: now,
                    } as UserAchievementEntity,
                    {
                        achievementId: "def-sword-shark",
                        tier: 2,
                        earnedAt: now,
                    } as UserAchievementEntity,
                            ],
                            inserted: false,
                        })

                        const result = await service.getMyAchievements(USER_ID)

                        expect(result.data[0]).toMatchObject({
                            slug: "sword-shark",
                            earned: true,
                            tierReached: 2,
                            currentValue: 30,
                        })
                        // one earned achievement in the ledger -> count 1
                        expect(result.count).toBe(1)
                        expect(result.newAchievements).toEqual([])
                    })
            })
    })
