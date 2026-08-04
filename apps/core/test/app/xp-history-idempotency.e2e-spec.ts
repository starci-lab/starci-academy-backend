import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    UserEntity,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    writeXpHistory,
} from "@features/api/processors/ai/shared/xp"
import {
    createE2eApp,
} from "../helpers/create-e2e-app"
import type {
    E2eApp,
} from "../helpers/create-e2e-app"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Proves the DB-level idempotency the unit test mocks away: the `(source, refId)`
 * unique constraint on `xp_histories` + the exactly-once `users.reward_points` credit.
 * Requires Docker (Testcontainers spins up a real Postgres in createE2eApp).
 */
describe("XP history idempotency (e2e)",
    () => {
        let e2e: E2eApp
        let entityManager: EntityManager

        beforeAll(async () => {
            e2e = await createE2eApp()
            entityManager = e2e.app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterAll(async () => {
            await e2e.app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"xp_histories\", \"users\" RESTART IDENTITY CASCADE",
            )
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-xp",
                    }),
            )

        it("records one ledger row and credits points once for a repeated (source, refId)",
            async () => {
                const user = await seedUser()
                const grant = {
                    entityManager,
                    userId: user.id,
                    courseId: null,
                    source: XpSource.Challenge,
                    amount: 80,
                    points: 80,
                    refId: "attempt-xyz",
                }

                // first grant records + credits; the re-grade (same refId) is a no-op
                await writeXpHistory(grant)
                await writeXpHistory(grant)

                const rows = await entityManager.count(XpHistoryEntity,
                    {
                        where: {
                            refId: "attempt-xyz",
                        },
                    })
                expect(rows).toBe(1)

                const fresh = await entityManager.findOne(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                // credited 80 exactly once, NOT 160 — writeXpHistory credits the
                // spendable Coin balance (`users.coin_balance`), not a separate
                // XP counter (there isn't one; the ledger IS the XP source of truth)
                expect(fresh?.coinBalance).toBe(80)
            })

        it("records and credits separately for distinct events",
            async () => {
                const user = await seedUser()
                const base = {
                    entityManager,
                    userId: user.id,
                    courseId: null,
                    source: XpSource.LessonRead,
                    amount: 3,
                    points: 3,
                }

                await writeXpHistory({
                    ...base,
                    refId: "content-1",
                })
                await writeXpHistory({
                    ...base,
                    refId: "content-2",
                })

                const rows = await entityManager.count(XpHistoryEntity)
                expect(rows).toBe(2)

                const fresh = await entityManager.findOne(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(fresh?.coinBalance).toBe(6)
            })
    })
