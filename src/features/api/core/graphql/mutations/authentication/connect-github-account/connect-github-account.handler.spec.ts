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
    GithubUserNotFoundException,
    GithubUserVerificationFailedException,
} from "@modules/exceptions"
import {
    MountStorageService,
} from "@modules/filesystem"
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
    ConnectGithubAccountCommand,
} from "./connect-github-account.command"
import {
    ConnectGithubAccountHandler,
} from "./connect-github-account.handler"

/** Shared GitHub `getByUsername` mock the faked Octokit instance exposes. */
const getByUsernameMock = jest.fn()

// Replace the Octokit client with a stub whose REST surface is the shared mock,
// so the handler's `new Octokit(...).rest.users.getByUsername(...)` is testable.
jest.mock("octokit",
    () => ({
        Octokit: jest.fn().mockImplementation(() => ({
            rest: {
                users: {
                    getByUsername: getByUsernameMock,
                },
            },
        })),
    }))

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a minimal user stand-in carrying only the fields the handler mutates.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with an id and a writable githubUsername.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
    githubUsername: null,
}) as unknown as UserEntity

describe("ConnectGithubAccountHandler",
    () => {
        let module: TestingModule
        let handler: ConnectGithubAccountHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            // reset the shared client mock between cases
            getByUsernameMock.mockReset()

            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    ConnectGithubAccountHandler,
                    {
                        provide: MountStorageService,
                        // only the access-token field is read by the handler
                        useValue: {
                            githubAccessToken: "ghp_token",
                        },
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ConnectGithubAccountHandler>(ConnectGithubAccountHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("verifies the username, writes it onto the user and persists",
            async () => {
                // GitHub confirms the account exists
                getByUsernameMock.mockResolvedValueOnce({
                    data: {
                        login: "octocat",
                    },
                })
                const user = fakeUser("user-1")

                const result = await handler.execute(
                    new ConnectGithubAccountCommand({
                        user,
                        input: {
                            githubUsername: "octocat",
                        },
                    }),
                )

                // the account is verified against GitHub by username
                expect(getByUsernameMock).toHaveBeenCalledWith({
                    username: "octocat",
                })
                // the verified username is stored on the user and saved
                expect(user.githubUsername).toBe("octocat")
                expect(entityManager.save).toHaveBeenCalledWith(user)
                // the updated user is returned
                expect(result).toBe(user)
            })

        it("throws GithubUserNotFound on a 404 from GitHub (no save)",
            async () => {
                // GitHub returns a 404 for an unknown username
                getByUsernameMock.mockRejectedValueOnce(
                    new Error("HttpError: 404 Not Found"),
                )

                await expect(
                    handler.execute(
                        new ConnectGithubAccountCommand({
                            user: fakeUser("user-1"),
                            input: {
                                githubUsername: "ghost",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(GithubUserNotFoundException)

                // the user is never persisted when verification fails
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("throws GithubUserVerificationFailed on a non-404 error (no save)",
            async () => {
                // a transient/auth error that is not a 404
                getByUsernameMock.mockRejectedValueOnce(
                    new Error("HttpError: 500 Internal Server Error"),
                )

                await expect(
                    handler.execute(
                        new ConnectGithubAccountCommand({
                            user: fakeUser("user-1"),
                            input: {
                                githubUsername: "octocat",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(GithubUserVerificationFailedException)

                expect(entityManager.save).not.toHaveBeenCalled()
            })
    })
