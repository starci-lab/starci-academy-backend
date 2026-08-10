import {
    writeActivity,
} from "./write-activity"
import {
    ActivityEntity,
} from "@modules/databases/postgresql/primary/entities/activity.entity"
import {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/**
 * `writeActivity` is a plain function (no DI) -- the caller's transaction
 * manager IS the dependency, so the mock is passed straight in rather than
 * wired through a `Test.createTestingModule`.
 *
 * THE ASSERTIONS READ THE ROW, NOT THE CALL. This function returns nothing, so the row it hands
 * the manager is the only outcome there is -- but asserting the whole call signature restates the
 * source, and goes red for a reordered argument while staying green for a wrong `type`. Capturing
 * the row and asserting its fields tests what gets written instead of how it was passed.
 */
describe("writeActivity",
    () => {
        let entityManager: EntityManagerMock

        const userId = "user-1"
        const idempotencyKey = "lesson-42"

        /** The dedup lookup the function ran, as `{ type, idempotencyKey }`. */
        const dedupLookup = () => {
            const [entity, options] = entityManager.findOne.mock.calls[0] ?? []
            return {
                entity,
                where: (options as { where?: unknown } | undefined)?.where,
            }
        }

        /** The row the function handed the manager to persist. */
        const savedRow = () => {
            const [entity, row] = entityManager.save.mock.calls[0] ?? []
            return {
                entity,
                row: row as Partial<ActivityEntity> & { payload?: unknown },
            }
        }

        beforeEach(() => {
            entityManager = makeEntityManagerMock()
        })

        it("appends a ledger row when no row exists yet for the (type, idempotencyKey) pair",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(null)

                const target = {
                    entityName: "ContentEntity",
                    id: "content-1",
                    label: "Intro to TypeScript",
                }

                await writeActivity({
                    entityManager: asEntityManager(entityManager),
                    userId,
                    type: ActivityType.LessonRead,
                    idempotencyKey,
                    metadata: {
                        target,
                    },
                })

                const {
                    entity,
                    row,
                } = savedRow()
                expect(entity).toBe(ActivityEntity)
                // the row is keyed by relation id, and the metadata is snapshotted under `payload`
                expect(row).toEqual({
                    user: {
                        id: userId,
                    },
                    type: ActivityType.LessonRead,
                    idempotencyKey,
                    payload: {
                        target,
                    },
                })
            })

        it("defaults the payload to null when no metadata is given",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(null)

                await writeActivity({
                    entityManager: asEntityManager(entityManager),
                    userId,
                    type: ActivityType.UserFollowed,
                    idempotencyKey,
                })

                // null rather than undefined: the column is written explicitly, so a later read
                // cannot tell "no metadata" apart from "column missing"
                expect(savedRow().row.payload).toBeNull()
            })

        it("is an idempotent no-op when a row for the (type, idempotencyKey) pair already exists",
            async () => {
                // a duplicate event -- the row was already recorded (re-read, re-grade, re-follow)
                entityManager.findOne.mockResolvedValueOnce({
                    id: "activity-existing",
                })

                await writeActivity({
                    entityManager: asEntityManager(entityManager),
                    userId,
                    type: ActivityType.ChallengePassed,
                    idempotencyKey,
                    metadata: {
                        target: {
                            entityName: "ChallengeEntity",
                            id: "challenge-1",
                            label: "Two Sum",
                        },
                    },
                })

                // NOTHING is written -- no duplicate feed row, ever. Absence is the outcome here,
                // so the call count IS the assertion.
                expect(entityManager.save.mock.calls).toHaveLength(0)
            })

        it("scopes the dedup lookup by BOTH type and idempotencyKey, so one key under two types is two events",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(null)

                await writeActivity({
                    entityManager: asEntityManager(entityManager),
                    userId,
                    type: ActivityType.CodingSolved,
                    idempotencyKey,
                })

                const {
                    entity,
                    where,
                } = dedupLookup()
                expect(entity).toBe(ActivityEntity)
                expect(where).toEqual({
                    type: ActivityType.CodingSolved,
                    idempotencyKey,
                })
            })
    })
