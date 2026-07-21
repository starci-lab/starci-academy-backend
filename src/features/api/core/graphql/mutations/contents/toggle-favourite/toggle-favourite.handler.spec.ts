// Import the module barrels that own the CQRS / elasticsearch base classes
// first so their classes are fully initialised before the handler pulls
// `@modules/cqrs` — avoids a "Class extends value undefined" load-order cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
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
    UserEntity,
} from "@modules/databases"
import {
    ToggleFavouriteCommand,
} from "./toggle-favourite.command"
import {
    ToggleFavouriteHandler,
} from "./toggle-favourite.handler"

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

describe("ToggleFavouriteHandler",
    () => {
        let module: TestingModule
        let handler: ToggleFavouriteHandler
        let entityManager: EntityManagerMock
        let userService: jest.Mocked<Pick<UserService, "resolveOrCreateTrialEnrollment">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // the enrollment anchor: resolves (or creates) the trial enrollment the
            // re-keyed user_contents row is stamped with; unused unless the content
            // resolves to a course
            userService = {
                resolveOrCreateTrialEnrollment: jest.fn(),
            } as unknown as jest.Mocked<Pick<UserService, "resolveOrCreateTrialEnrollment">>

            module = await Test.createTestingModule({
                providers: [
                    ToggleFavouriteHandler,
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ToggleFavouriteHandler>(ToggleFavouriteHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no DB access)",
            async () => {
                await expect(
                    handler.execute(
                        new ToggleFavouriteCommand({
                            request: {
                                contentId: "content-1",
                                isFavorite: true,
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // guard fires before any persistence happens
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("creates a new user-content row when none exists",
            async () => {
                // no existing row → handler must create one with the flag set
                entityManager.findOne.mockResolvedValueOnce(null)

                await handler.execute(
                    new ToggleFavouriteCommand({
                        request: {
                            contentId: "content-1",
                            isFavorite: true,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // a fresh row is built carrying the user, content and favourite flag
                expect(entityManager.create).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        userId: "user-1",
                        contentId: "content-1",
                        isFavorite: true,
                    },
                )
                // and the new row is persisted
                expect(entityManager.save).toHaveBeenCalledWith({
                    userId: "user-1",
                    contentId: "content-1",
                    isFavorite: true,
                })
            })

        it("updates the flag on an existing row instead of creating one",
            async () => {
                // an existing row is found → its flag is flipped in place
                const existing = {
                    userId: "user-1",
                    contentId: "content-1",
                    isFavorite: true,
                }
                entityManager.findOne.mockResolvedValueOnce(existing)

                await handler.execute(
                    new ToggleFavouriteCommand({
                        request: {
                            contentId: "content-1",
                            isFavorite: false,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the existing row is mutated, not recreated
                expect(entityManager.create).not.toHaveBeenCalled()
                expect(existing.isFavorite).toBe(false)
                expect(entityManager.save).toHaveBeenCalledWith(existing)
            })
    })
