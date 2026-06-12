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
    ReactionService,
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

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // cache invalidation hook — assert it fires after persistence
            reactionService = {
                invalidateViewCount: jest.fn(),
            } as unknown as jest.Mocked<Pick<ReactionService, "invalidateViewCount">>

            module = await Test.createTestingModule({
                providers: [
                    MarkAsReadedHandler,
                    {
                        provide: ReactionService,
                        useValue: reactionService,
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
                // no existing row → handler builds one with the read flag set
                entityManager.findOne.mockResolvedValueOnce(null)

                await handler.execute(
                    new MarkAsReadedCommand({
                        request: {
                            contentId: "content-1",
                            readed: true,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // a fresh row carries the user, content and read flag
                expect(entityManager.create).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        userId: "user-1",
                        contentId: "content-1",
                        isRead: true,
                    },
                )
                // persisted, then the cached view count is invalidated
                expect(entityManager.save).toHaveBeenCalledWith({
                    userId: "user-1",
                    contentId: "content-1",
                    isRead: true,
                })
                expect(reactionService.invalidateViewCount).toHaveBeenCalledWith("content-1")
            })

        it("updates the read flag on an existing row instead of creating one",
            async () => {
                // an existing row is found → its read flag is flipped in place
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
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the existing row is mutated, not recreated
                expect(entityManager.create).not.toHaveBeenCalled()
                expect(existing.isRead).toBe(false)
                expect(entityManager.save).toHaveBeenCalledWith(existing)
                expect(reactionService.invalidateViewCount).toHaveBeenCalledWith("content-1")
            })
    })
