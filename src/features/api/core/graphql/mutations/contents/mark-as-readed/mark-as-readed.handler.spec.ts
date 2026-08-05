// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
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
    ProgressProjectionService,
    ReactionService,
    UserService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    EnrollmentEntity,
    UserEntity,
} from "@modules/databases"
import {
    MarkAsReadedCommand,
} from "./mark-as-readed.command"
import {
    MarkAsReadedHandler,
} from "./mark-as-readed.handler"

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

describe("MarkAsReadedHandler",
    () => {
        let module: TestingModule
        let handler: MarkAsReadedHandler
        let entityManager: EntityManagerMock
        let reactionService: jest.Mocked<Pick<ReactionService, "invalidateViewCount">>
        let userService: jest.Mocked<Pick<UserService, "resolveOrCreateTrialEnrollment">>
        let progressProjectionService: jest.Mocked<Pick<ProgressProjectionService, "recompute">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // cache invalidation hook -- assert it fires after persistence
            reactionService = {
                invalidateViewCount: jest.fn(),
            } as unknown as jest.Mocked<Pick<ReactionService, "invalidateViewCount">>

            // the enrollment anchor: resolves (or creates) the trial enrollment the
            // re-keyed user_contents row is stamped with
            userService = {
                resolveOrCreateTrialEnrollment: jest.fn(),
            } as unknown as jest.Mocked<Pick<UserService, "resolveOrCreateTrialEnrollment">>

            // progression recompute (invoked only on the deliberate-read course branch)
            progressProjectionService = {
                recompute: jest.fn(),
            } as unknown as jest.Mocked<Pick<ProgressProjectionService, "recompute">>

            module = await Test.createTestingModule({
                providers: [
                    MarkAsReadedHandler,
                    {
                        provide: ReactionService,
                        useValue: reactionService,
                    },
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                    {
                        provide: ProgressProjectionService,
                        useValue: progressProjectionService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<MarkAsReadedHandler>(MarkAsReadedHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no DB / cache access)",
            async () => {
                await expect(
                    handler.execute(
                        new MarkAsReadedCommand({
                            request: {
                                contentId: "content-1",
                                readed: true,
                                silent: false,
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // guard fires before any side effect
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(reactionService.invalidateViewCount).not.toHaveBeenCalled()
            })

        it("creates a new user-content row and invalidates the view cache",
            async () => {
                // no existing row -> handler builds one with the read flag set
                entityManager.findOne.mockResolvedValueOnce(null)

                await handler.execute(
                    new MarkAsReadedCommand({
                        request: {
                            contentId: "content-1",
                            readed: true,
                            silent: false,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // a fresh row is built for the user+content, then the read flag is set
                expect(entityManager.create).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        userId: "user-1",
                        contentId: "content-1",
                    }),
                )
                // persisted with the read flag, then the cached view count is invalidated
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        userId: "user-1",
                        contentId: "content-1",
                        isRead: true,
                    }),
                )
                expect(reactionService.invalidateViewCount).toHaveBeenCalledWith("content-1")
            })

        it("grants XP + reward points on a deliberate (non-silent) read",
            async () => {
                // no existing row, no `silent` flag -> the deliberate reward path runs
                entityManager.findOne.mockResolvedValueOnce(null)

                await handler.execute(
                    new MarkAsReadedCommand({
                        request: {
                            contentId: "content-1",
                            readed: true,
                            silent: false,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the reward-points balance is credited (writeXpHistory -> increment)
                expect(entityManager.increment).toHaveBeenCalled()
            })

        it("silent read updates progress WITHOUT granting XP or posting activity",
            async () => {
                // no existing row; silent -> only the read flag is persisted
                entityManager.findOne.mockResolvedValueOnce(null)

                await handler.execute(
                    new MarkAsReadedCommand({
                        request: {
                            contentId: "content-1",
                            readed: true,
                            silent: true,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // progress is still saved
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        userId: "user-1",
                        contentId: "content-1",
                        isRead: true,
                    }),
                )
                // reward branch is skipped entirely: no points credit. The handler still
                // loads the user-content row AND the content (to resolve the course for the
                // enrollment re-key), so exactly two reads happen -- no XP-branch extra loads.
                expect(entityManager.increment).not.toHaveBeenCalled()
                expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                expect(reactionService.invalidateViewCount).toHaveBeenCalledWith("content-1")
            })

        it("updates the read flag on an existing row instead of creating one",
            async () => {
                // an existing row is found -> its read flag is flipped in place
                const existing = {
                    userId: "user-1",
                    contentId: "content-1",
                    isRead: true,
                }
                entityManager.findOne.mockResolvedValueOnce(existing)

                await handler.execute(
                    new MarkAsReadedCommand({
                        request: {
                            contentId: "content-1",
                            readed: false,
                            silent: false,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the existing row is mutated, not recreated
                expect(entityManager.create).not.toHaveBeenCalled()
                expect(existing.isRead).toBe(false)
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.anything(),
                    existing,
                )
                expect(reactionService.invalidateViewCount).toHaveBeenCalledWith("content-1")
            })

        // Enrollment re-key round-trip: when the content resolves to a course, the
        // saved user_contents row must carry the resolved enrollment (enrollment_id),
        // proving the write goes through the enrollment anchor -- not just user_id.
        it("stamps the resolved enrollment on the saved user-content row (re-key write)",
            async () => {
                const enrollment = {
                    id: "enrollment-99",
                } as EnrollmentEntity
                // 1) no existing user-content row
                entityManager.findOne.mockResolvedValueOnce(null)
                // 2) the content resolves to a course (module -> course) so the row is
                //    keyed by enrollment
                entityManager.findOne.mockResolvedValueOnce({
                    id: "content-1",
                    module: {
                        courseId: "course-1",
                        course: {
                            id: "course-1",
                        },
                    },
                })
                // the anchor resolves the (trial) enrollment for this user x course
                userService.resolveOrCreateTrialEnrollment.mockResolvedValueOnce(enrollment)

                await handler.execute(
                    new MarkAsReadedCommand({
                        request: {
                            contentId: "content-1",
                            readed: true,
                            // silent -> skip XP/activity, isolate the re-key write
                            silent: true,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the enrollment is resolved for the content's course
                expect(userService.resolveOrCreateTrialEnrollment).toHaveBeenCalledWith(
                    "user-1",
                    "course-1",
                )
                // and the persisted user_contents row carries that enrollment relation
                // (enrollment_id is set on write -- the anchor going forward)
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        userId: "user-1",
                        contentId: "content-1",
                        isRead: true,
                        enrollment,
                    }),
                )
            })

        // Read side of the round-trip: the projection recompute (which the leaderboard /
        // my-rank reads consume via the enrollment_id-keyed projection) is invoked for
        // the content's course on a deliberate read.
        it("recomputes the enrollment-keyed progress projection on a deliberate read",
            async () => {
                const enrollment = {
                    id: "enrollment-99",
                } as EnrollmentEntity
                entityManager.findOne.mockResolvedValueOnce(null)
                entityManager.findOne.mockResolvedValueOnce({
                    id: "content-1",
                    module: {
                        courseId: "course-1",
                        course: {
                            id: "course-1",
                        },
                    },
                })
                userService.resolveOrCreateTrialEnrollment.mockResolvedValueOnce(enrollment)

                await handler.execute(
                    new MarkAsReadedCommand({
                        request: {
                            contentId: "content-1",
                            readed: true,
                            // deliberate (non-silent) read -> recompute the projection
                            silent: false,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the projection that the enrollment-keyed leaderboard/rank reads off is
                // refreshed for this user's course
                expect(progressProjectionService.recompute).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        courseId: "course-1",
                    }),
                )
            })
    })
