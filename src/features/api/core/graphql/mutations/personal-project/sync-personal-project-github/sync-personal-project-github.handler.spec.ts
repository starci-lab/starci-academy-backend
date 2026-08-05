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
    PersonalProjectGithubSyncInputMissingException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-github-sync-input-missing"
import {
    PersonalProjectGithubUrlMissingException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-github-url-missing"
import {
    PersonalProjectInvalidBranchNameException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-invalid-branch-name"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    UrlValidatorService,
} from "@modules/lib/validators/url.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    SyncPersonalProjectGithubCommand,
} from "./sync-personal-project-github.command"
import {
    SyncPersonalProjectGithubHandler,
} from "./sync-personal-project-github.handler"

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

describe("SyncPersonalProjectGithubHandler",
    () => {
        let module: TestingModule
        let handler: SyncPersonalProjectGithubHandler
        let entityManager: EntityManagerMock
        let urlValidatorService: jest.Mocked<Pick<UrlValidatorService, "isParsable">>
        let encryptionService: jest.Mocked<Pick<EncryptionService, "encrypt">>

        beforeEach(async () => {
            // fresh jest-backed entity manager -- `transaction` runs the callback inline
            entityManager = makeEntityManagerMock()
            // `findOneOrFail` is not part of the shared mock surface -- add it
            entityManager.findOneOrFail = jest.fn()

            // url syntactic-validation hook used only when a url is supplied
            urlValidatorService = {
                isParsable: jest.fn(),
            } as unknown as jest.Mocked<Pick<UrlValidatorService, "isParsable">>

            // token-encryption hook used only when a githubToken is supplied
            encryptionService = {
                encrypt: jest.fn(),
            } as unknown as jest.Mocked<Pick<EncryptionService, "encrypt">>

            module = await Test.createTestingModule({
                providers: [
                    SyncPersonalProjectGithubHandler,
                    {
                        provide: UrlValidatorService,
                        useValue: urlValidatorService,
                    },
                    {
                        provide: EncryptionService,
                        useValue: encryptionService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<SyncPersonalProjectGithubHandler>(SyncPersonalProjectGithubHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no transaction)",
            async () => {
                await expect(
                    handler.execute(
                        new SyncPersonalProjectGithubCommand({
                            request: {
                                courseId: "course-1",
                                githubUrl: "https://github.com/me/repo",
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // guard fires before opening a transaction
                expect(entityManager.transaction).not.toHaveBeenCalled()
            })

        it("validates + writes the url onto the enrollment when a url is supplied",
            async () => {
                // the enrollment exists; start with no stored url
                const enrollment = {
                    id: "enroll-1",
                    personalProjectGithubUrl: null,
                    personalProjectGithubBranch: null,
                }
                entityManager.findOneOrFail.mockResolvedValueOnce(enrollment)

                await handler.execute(
                    new SyncPersonalProjectGithubCommand({
                        request: {
                            courseId: "course-1",
                            githubUrl: "  https://github.com/me/repo  ",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the supplied url is syntactically validated (trimmed)
                expect(urlValidatorService.isParsable).toHaveBeenCalledWith("https://github.com/me/repo")
                // the trimmed url is written onto the enrollment + persisted
                expect(enrollment.personalProjectGithubUrl).toBe("https://github.com/me/repo")
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.anything(),
                    enrollment,
                )
            })

        it("writes the branch + clears it to null on an empty-string branch",
            async () => {
                // a stored url already exists so branch-only sync is allowed
                const enrollment = {
                    id: "enroll-1",
                    personalProjectGithubUrl: "https://github.com/me/repo",
                    personalProjectGithubBranch: "old",
                }
                entityManager.findOneOrFail.mockResolvedValueOnce(enrollment)

                await handler.execute(
                    new SyncPersonalProjectGithubCommand({
                        request: {
                            courseId: "course-1",
                            branch: "feature/x",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // no url supplied -> url validation is skipped
                expect(urlValidatorService.isParsable).not.toHaveBeenCalled()
                // the new branch is written onto the enrollment
                expect(enrollment.personalProjectGithubBranch).toBe("feature/x")
                expect(entityManager.save).toHaveBeenCalled()
            })

        it("rejects when neither a url nor a branch is provided",
            async () => {
                // enrollment loads fine; the request itself carries nothing to sync
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "enroll-1",
                    personalProjectGithubUrl: null,
                    personalProjectGithubBranch: null,
                })

                await expect(
                    handler.execute(
                        new SyncPersonalProjectGithubCommand({
                            request: {
                                courseId: "course-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PersonalProjectGithubSyncInputMissingException)

                // nothing is persisted for an empty sync
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("rejects a branch-only sync when the enrollment has no stored url",
            async () => {
                // branch supplied but no stored url to attach it to
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "enroll-1",
                    personalProjectGithubUrl: null,
                    personalProjectGithubBranch: null,
                })

                await expect(
                    handler.execute(
                        new SyncPersonalProjectGithubCommand({
                            request: {
                                courseId: "course-1",
                                branch: "feature/x",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PersonalProjectGithubUrlMissingException)

                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("rejects a branch that violates the allowed-character pattern",
            async () => {
                // stored url present, but the branch name contains an illegal space
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "enroll-1",
                    personalProjectGithubUrl: "https://github.com/me/repo",
                    personalProjectGithubBranch: null,
                })

                await expect(
                    handler.execute(
                        new SyncPersonalProjectGithubCommand({
                            request: {
                                courseId: "course-1",
                                branch: "bad branch",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PersonalProjectInvalidBranchNameException)

                expect(entityManager.save).not.toHaveBeenCalled()
            })
    })
