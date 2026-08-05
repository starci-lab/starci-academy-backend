import {
    writeActivity,
} from "./write-activity"
import {
    ActivityEntity,
    ActivityType,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/**
 * `writeActivity` is a plain function (no DI) -- the caller's transaction
 * manager IS the dependency, so the mock is passed straight in rather than
 * wired through a `Test.createTestingModule`.
 */
describe("writeActivity",
    () => {
        let entityManager: EntityManagerMock

        const userId = "user-1"
        const idempotencyKey = "lesson-42"

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
                    entityManager,
                    userId,
                    type: ActivityType.LessonRead,
                    idempotencyKey,
                    metadata: {
                        target,
                    },
                })

                // the dedup gate reads the (type, idempotencyKey) unique key first
                expect(entityManager.findOne).toHaveBeenCalledWith(
                    ActivityEntity,
                    {
                        where: {
                            type: ActivityType.LessonRead,
                            idempotencyKey,
                        },
                        select: {
                            id: true,
                        },
                    },
                )
                // then appends the row via relation id, snapshot under `payload`
                expect(entityManager.save).toHaveBeenCalledWith(
                    ActivityEntity,
                    {
                        user: {
                            id: userId,
                        },
                        type: ActivityType.LessonRead,
                        idempotencyKey,
                        payload: {
                            target,
                        },
                    },
                )
            })

        it("defaults metadata to null when omitted",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(null)

                await writeActivity({
                    entityManager,
                    userId,
                    type: ActivityType.UserFollowed,
                    idempotencyKey,
                })

                expect(entityManager.save).toHaveBeenCalledWith(
                    ActivityEntity,
                    expect.objectContaining({
                        payload: null,
                    }),
                )
            })

        it("is an idempotent no-op when a row for the (type, idempotencyKey) pair already exists",
            async () => {
                // a duplicate event -- the row was already recorded (re-read, re-grade, re-follow)
                entityManager.findOne.mockResolvedValueOnce({
                    id: "activity-existing",
                })

                await writeActivity({
                    entityManager,
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

                // NOTHING is written -- no duplicate feed row, ever
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("scopes the dedup lookup by BOTH type and idempotencyKey (same key, different type, is a distinct event)",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(null)

                await writeActivity({
                    entityManager,
                    userId,
                    type: ActivityType.CodingSolved,
                    idempotencyKey,
                })

                expect(entityManager.findOne).toHaveBeenCalledWith(
                    ActivityEntity,
                    expect.objectContaining({
                        where: {
                            type: ActivityType.CodingSolved,
                            idempotencyKey,
                        },
                    }),
                )
            })
    })
