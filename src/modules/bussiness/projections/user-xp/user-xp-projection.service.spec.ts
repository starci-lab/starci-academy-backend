import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    UserXpProjectionService,
} from "./user-xp-projection.service"
import type {
    UserXpProjectionEntity,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The user under test — value is irrelevant; it is only threaded into params. */
const USER_ID = "user-xp-1"

/** Default TTL the SUT reads off `envConfig().projection.staleAfterMs` (5 minutes). */
const STALE_AFTER_MS = 5 * 60 * 1000

/** True when a raw SQL string is the projection's UPSERT (vs any other query call). */
const isUpsertSql = (sql: unknown): boolean =>
    String(sql).includes("INSERT INTO user_xp_projections")

describe("UserXpProjectionService",
    () => {
        let entityManager: EntityManagerMock

        /** Build the SUT wired with a fresh, happy-path-defaulted entity-manager mock. */
        const build = async (): Promise<UserXpProjectionService> => {
            entityManager = makeEntityManagerMock()

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    UserXpProjectionService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()
            return module.get(UserXpProjectionService)
        }

        /** Build a projection row with the given jsonb value + freshness timestamp. */
        const buildRow = (
            value: Record<string, unknown>,
            updatedAt: Date,
        ): UserXpProjectionEntity => ({
            userId: USER_ID,
            value,
            updatedAt,
        } as UserXpProjectionEntity)

        describe("recompute",
            () => {
                it("runs the UPSERT on the injected connection when no transaction manager is given",
                    async () => {
                        const service = await build()

                        await service.recompute({
                            userId: USER_ID,
                        })

                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0] as [unknown, Array<unknown>]
                        expect(isUpsertSql(sql)).toBe(true)
                        expect(params).toEqual([
                            USER_ID,
                        ])
                    })

                it("honours the caller's transaction manager instead of the injected connection",
                    async () => {
                        const service = await build()
                        const txManager = makeEntityManagerMock()

                        await service.recompute({
                            userId: USER_ID,
                            entityManager: txManager as unknown as EntityManager,
                        })

                        expect(txManager.query).toHaveBeenCalledTimes(1)
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("propagates a query failure from the injected connection",
                    async () => {
                        const service = await build()
                        const dbError = new Error("connection lost")
                        entityManager.query.mockRejectedValueOnce(dbError)

                        await expect(service.recompute({
                            userId: USER_ID,
                        })).rejects.toThrow(dbError)
                    })
            })

        describe("getXp",
            () => {
                it("returns the aggregate straight from a fresh row without recomputing",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow({
                            challengeXp: 10,
                            milestoneXp: 5,
                            codingXp: 2,
                            lessonXp: 1,
                            totalPoints: 18,
                            coinBalance: 100,
                        },
                        new Date()))

                        const result = await service.getXp({
                            userId: USER_ID,
                        })

                        expect(result).toEqual({
                            challengeXp: 10,
                            milestoneXp: 5,
                            codingXp: 2,
                            lessonXp: 1,
                            totalPoints: 18,
                            coinBalance: 100,
                        })
                        // fresh row → the TTL lazy-refresh must NOT fire
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(entityManager.findOne).toHaveBeenCalledTimes(1)
                    })

                it("lazily recomputes a row past the staleness TTL, then re-reads it",
                    async () => {
                        const service = await build()
                        const staleRow = buildRow({
                            totalPoints: 1,
                        },
                        new Date(Date.now() - STALE_AFTER_MS - 1000))
                        const freshRow = buildRow({
                            totalPoints: 99,
                            coinBalance: 50,
                        },
                        new Date())
                        entityManager.findOne
                            .mockResolvedValueOnce(staleRow)
                            .mockResolvedValueOnce(freshRow)

                        const result = await service.getXp({
                            userId: USER_ID,
                        })

                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                        expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                        expect(result.totalPoints).toBe(99)
                        expect(result.coinBalance).toBe(50)
                    })

                it("recomputes a missing row and returns a zeroed aggregate when still absent",
                    async () => {
                        const service = await build()
                        // findOne defaults to null both before AND after the recompute

                        const result = await service.getXp({
                            userId: USER_ID,
                        })

                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                        expect(result).toEqual({
                            challengeXp: 0,
                            milestoneXp: 0,
                            codingXp: 0,
                            lessonXp: 0,
                            totalPoints: 0,
                            coinBalance: 0,
                        })
                    })

                it("coerces a non-numeric or missing metric to 0 instead of NaN",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow({
                            challengeXp: "not-a-number",
                            totalPoints: "42",
                            // milestoneXp / codingXp / lessonXp / coinBalance intentionally absent
                        },
                        new Date()))

                        const result = await service.getXp({
                            userId: USER_ID,
                        })

                        expect(result.challengeXp).toBe(0)
                        expect(result.totalPoints).toBe(42)
                        expect(result.milestoneXp).toBe(0)
                        expect(result.coinBalance).toBe(0)
                    })

                it("propagates a findOne failure while reading the projection row",
                    async () => {
                        const service = await build()
                        const dbError = new Error("read replica unavailable")
                        entityManager.findOne.mockRejectedValueOnce(dbError)

                        await expect(service.getXp({
                            userId: USER_ID,
                        })).rejects.toThrow(dbError)
                    })

                it("propagates a recompute failure triggered by the lazy refresh",
                    async () => {
                        const service = await build()
                        // findOne defaults to null → drives getXp into the recompute branch
                        const dbError = new Error("upsert failed")
                        entityManager.query.mockRejectedValueOnce(dbError)

                        await expect(service.getXp({
                            userId: USER_ID,
                        })).rejects.toThrow(dbError)
                    })
            })
    })
