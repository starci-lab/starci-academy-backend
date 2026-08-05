// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    SubmitPersonalGithubUrlCommand,
} from "./submit-personal-github-url.command"
import {
    SubmitPersonalGithubUrlHandler,
} from "./submit-personal-github-url.handler"

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

describe("SubmitPersonalGithubUrlHandler",
    () => {
        let module: TestingModule
        let handler: SubmitPersonalGithubUrlHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // `findOneOrFail` is not part of the shared mock surface -- add it
            entityManager.findOneOrFail = jest.fn()

            module = await Test.createTestingModule({
                providers: [
                    SubmitPersonalGithubUrlHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<SubmitPersonalGithubUrlHandler>(SubmitPersonalGithubUrlHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no DB access)",
            async () => {
                await expect(
                    handler.execute(
                        new SubmitPersonalGithubUrlCommand({
                            request: {
                                courseId: "course-1",
                                githubUrl: "https://github.com/me/repo",
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // guard fires before loading the enrollment
                expect(entityManager.findOneOrFail).not.toHaveBeenCalled()
            })

        it("stores the github url on the loaded enrollment and returns the saved row",
            async () => {
                // the enrollment exists for this user + course
                const enrollment = {
                    id: "enroll-1",
                    personalProjectGithubUrl: null,
                }
                entityManager.findOneOrFail.mockResolvedValueOnce(enrollment)
                // two-arg save(Entity, row) -> program it to echo the saved row
                entityManager.save.mockResolvedValueOnce(enrollment)

                const result = await handler.execute(
                    new SubmitPersonalGithubUrlCommand({
                        request: {
                            courseId: "course-1",
                            githubUrl: "https://github.com/me/repo",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the url is written onto the enrollment before persisting
                expect(enrollment.personalProjectGithubUrl).toBe("https://github.com/me/repo")
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.anything(),
                    enrollment,
                )
                // the saved enrollment is echoed back to the caller
                expect(result).toBe(enrollment)
            })

        it("propagates the not-found error when the enrollment is missing",
            async () => {
                // no enrollment for this user + course -> findOneOrFail rejects
                entityManager.findOneOrFail.mockRejectedValueOnce(
                    new Error("enrollment not found"),
                )

                await expect(
                    handler.execute(
                        new SubmitPersonalGithubUrlCommand({
                            request: {
                                courseId: "course-1",
                                githubUrl: "https://github.com/me/repo",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toThrow("enrollment not found")

                // nothing is persisted when the enrollment cannot be loaded
                expect(entityManager.save).not.toHaveBeenCalled()
            })
    })
