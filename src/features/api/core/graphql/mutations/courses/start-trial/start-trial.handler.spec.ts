// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CourseEntity,
    EnrollmentEntity,
    PricingPhase,
} from "@modules/databases"
import {
    CourseNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    UserEntity,
} from "@modules/databases"
import {
    StartTrialCommand,
} from "./start-trial.command"
import {
    StartTrialHandler,
} from "./start-trial.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("StartTrialHandler",
    () => {
        let module: TestingModule
        let handler: StartTrialHandler
        let entityManager: EntityManagerMock

        const courseId = "course-1"
        const userId = "user-1"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    StartTrialHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<StartTrialHandler>(StartTrialHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no DB access)",
            async () => {
                await expect(
                    handler.execute(
                        new StartTrialCommand({
                            request: {
                                courseId,
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // the user guard fires before any course / enrollment lookup
                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("throws CourseNotFound when the course does not exist (no enrollment write)",
            async () => {
                // first findOne (the course lookup) resolves null → course missing
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new StartTrialCommand({
                            request: {
                                courseId,
                            },
                            user: fakeUser(userId),
                        }),
                    ),
                ).rejects.toBeInstanceOf(CourseNotFoundException)

                // bailed after the course lookup — never created or saved an enrollment
                expect(entityManager.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("creates a fresh TRIAL enrollment (is_enrolled = false) when none exists",
            async () => {
                // 1) course exists (with a current pricing phase in metadata)
                entityManager.findOne.mockResolvedValueOnce({
                    id: courseId,
                    metadata: {
                        currentPhase: PricingPhase.Pioneer,
                    },
                } as CourseEntity)
                // 2) no existing enrollment → fresh trial path
                entityManager.findOne.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new StartTrialCommand({
                        request: {
                            courseId,
                        },
                        user: fakeUser(userId),
                    }),
                )

                // the freshly built enrollment is a TRIAL placeholder for this user+course,
                // stamped with the course's current pricing phase
                expect(entityManager.create).toHaveBeenCalledWith(
                    EnrollmentEntity,
                    expect.objectContaining({
                        user: {
                            id: userId,
                        },
                        course: {
                            id: courseId,
                        },
                        pricingPhase: PricingPhase.Pioneer,
                        isEnrolled: false,
                    }),
                )
                // persisted, and the response reflects the trial flag (not yet enrolled)
                expect(entityManager.save).toHaveBeenCalledTimes(1)
                expect(result).toEqual({
                    isEnrolled: false,
                })
            })

        it("defaults the pricing phase to EarlyBird when course metadata is absent",
            async () => {
                // course exists but carries no metadata → phase falls back to EarlyBird
                entityManager.findOne.mockResolvedValueOnce({
                    id: courseId,
                } as CourseEntity)
                entityManager.findOne.mockResolvedValueOnce(null)

                await handler.execute(
                    new StartTrialCommand({
                        request: {
                            courseId,
                        },
                        user: fakeUser(userId),
                    }),
                )

                expect(entityManager.create).toHaveBeenCalledWith(
                    EnrollmentEntity,
                    expect.objectContaining({
                        pricingPhase: PricingPhase.EarlyBird,
                        isEnrolled: false,
                    }),
                )
            })

        it("is idempotent: an existing enrollment is a no-op returning its flag",
            async () => {
                // 1) course exists
                entityManager.findOne.mockResolvedValueOnce({
                    id: courseId,
                    metadata: {
                        currentPhase: PricingPhase.EarlyBird,
                    },
                } as CourseEntity)
                // 2) an enrollment already exists (here: a real/paid one)
                entityManager.findOne.mockResolvedValueOnce({
                    id: "enrollment-1",
                    isEnrolled: true,
                } as EnrollmentEntity)

                const result = await handler.execute(
                    new StartTrialCommand({
                        request: {
                            courseId,
                        },
                        user: fakeUser(userId),
                    }),
                )

                // no new row is built or saved — the existing flag is echoed back
                expect(entityManager.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(result).toEqual({
                    isEnrolled: true,
                })
            })

        it("idempotently recovers when a concurrent insert wins the unique race",
            async () => {
                // 1) course exists
                entityManager.findOne.mockResolvedValueOnce({
                    id: courseId,
                    metadata: {
                        currentPhase: PricingPhase.EarlyBird,
                    },
                } as CourseEntity)
                // 2) no enrollment at first read → we take the create path
                entityManager.findOne.mockResolvedValueOnce(null)
                // save blows up on the UQ_enrollments_user_course race
                entityManager.save.mockRejectedValueOnce(
                    new Error("duplicate key value violates unique constraint"),
                )
                // 3) the recovery re-read finds the row the racing request created
                entityManager.findOne.mockResolvedValueOnce({
                    id: "enrollment-raced",
                    isEnrolled: false,
                } as EnrollmentEntity)

                const result = await handler.execute(
                    new StartTrialCommand({
                        request: {
                            courseId,
                        },
                        user: fakeUser(userId),
                    }),
                )

                // the race is swallowed and the now-existing trial flag is returned
                expect(result).toEqual({
                    isEnrolled: false,
                })
            })
    })
