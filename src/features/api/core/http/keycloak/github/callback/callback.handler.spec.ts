jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn().mockReturnValue({
            keycloak: {
                redirectUri: {
                    github: "https://app.test/oauth/callback",
                },
            },
        }),
    }))

import {
    AuthenticationType,
} from "@modules/databases/postgresql/primary/enums/authentication-type"
import {
    KeycloakGithubCallbackCommand,
} from "./callback.command"
import {
    KeycloakGithubCallbackHandler,
} from "./callback.handler"

describe("KeycloakGithubCallbackHandler",
    () => {
        const createHandler = () => {
            const exchangeCodeForToken = jest.fn().mockResolvedValue({
                access_token: "access-token",
                refresh_token: "refresh-token",
            })
            const decode = jest.fn().mockReturnValue({
                sub: "keycloak-user",
                email: "user@example.com",
                preferred_username: "octocat",
            })
            const findOne = jest.fn().mockResolvedValue(null)
            const create = jest.fn().mockReturnValue({
                id: "local-user",
            })
            const save = jest.fn().mockResolvedValue(undefined)
            const handler = new KeycloakGithubCallbackHandler(
                {
                    exchangeCodeForToken,
                } as never,
                {
                    findOne,
                    create,
                    save,
                } as never,
                {
                    decode,
                } as never,
            )
            return {
                handler,
                exchangeCodeForToken,
                decode,
                findOne,
                create,
                save,
            }
        }

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("creates a GitHub-authenticated local user and returns both tokens",
            async () => {
                const setup = createHandler()

                await expect(setup.handler.execute(
                    new KeycloakGithubCallbackCommand({
                        code: "authorization-code",
                        sessionState: "session",
                        iss: "issuer",
                    }),
                )).resolves.toEqual({
                    id: "local-user",
                    accessToken: "access-token",
                    refreshToken: "refresh-token",
                })

                expect(setup.exchangeCodeForToken).toHaveBeenCalledWith({
                    code: "authorization-code",
                    redirectUri: "https://app.test/oauth/callback",
                    codeVerifier: "",
                })
                expect(setup.decode).toHaveBeenCalledWith("access-token")
                expect(setup.create).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        username: "octocat",
                        email: "user@example.com",
                        keycloakId: "keycloak-user",
                        githubUsername: "octocat",
                        authenticationType: AuthenticationType.Github,
                    }),
                )
                expect(setup.save).toHaveBeenCalledTimes(1)
            })

        it("backfills a missing username on an existing user",
            async () => {
                const setup = createHandler()
                const user = {
                    id: "existing-user",
                    githubUsername: null,
                }
                setup.findOne.mockResolvedValue(user)

                await expect(setup.handler.execute(
                    new KeycloakGithubCallbackCommand({
                        code: "code",
                        sessionState: "session",
                        iss: "issuer",
                    }),
                )).resolves.toMatchObject({
                    id: "existing-user",
                    accessToken: "access-token",
                })

                expect(user.githubUsername).toBe("octocat")
                expect(setup.create).not.toHaveBeenCalled()
                expect(setup.save).toHaveBeenCalledWith(user)
            })

        it("does not overwrite a user that already has a GitHub username",
            async () => {
                const setup = createHandler()
                const user = {
                    id: "existing-user",
                    githubUsername: "already-linked",
                }
                setup.findOne.mockResolvedValue(user)

                await setup.handler.execute(
                    new KeycloakGithubCallbackCommand({
                        code: "code",
                        sessionState: "session",
                        iss: "issuer",
                    }),
                )

                expect(setup.save).not.toHaveBeenCalled()
                expect(user.githubUsername).toBe("already-linked")
            })
    })
