import {
    CommandBus,
    QueryBus,
} from "@nestjs/cqrs"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    GithubApiAuthService,
} from "@modules/integrations/github/auth.service"
import {
    GithubOauthRedirectService,
} from "@modules/integrations/github/oauth-redirect.service"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    GithubOauthRedirectCommand,
} from "@features/api/core/http/github/oauth/redirect/redirect.command"
import {
    GithubOauthRedirectCommandHandler,
} from "@features/api/core/http/github/oauth/redirect/redirect.handler"
import {
    GithubOauthCallbackCommand,
} from "@features/api/core/http/github/oauth/callback/callback.command"
import {
    GithubOauthCallbackHandler,
} from "@features/api/core/http/github/oauth/callback/callback.handler"
import {
    MeHandler,
} from "@features/api/core/graphql/queries/authentication/me/me.handler"
import {
    MeQuery,
} from "@features/api/core/graphql/queries/authentication/me/me.query"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

// The flow replaces the GitHub client at its process boundary. Mocking the
// package also avoids loading optional Octokit plugins that are irrelevant here.
jest.mock("octokit",
    () => ({
        Octokit: jest.fn(),
    }))

/** A learner completes GitHub OAuth and sees the linked identity on the profile. */
describe("a learner links GitHub and sees it on the authenticated profile",
    () => {
        const KEYCLOAK_ID = "kc-github-account-link-flow"
        const GITHUB_LOGIN = "starci-learner"
        const RETURN_URI = "https://academy.starci.test/settings/integrations"

        let world: FlowWorld
        let commandBus: CommandBus
        let queryBus: QueryBus
        let learner: UserEntity
        let oauthState: string

        beforeAll(async () => {
            world = await bootFlowWorld({
                providers: [
                    UserService,
                    EncryptionService,
                    GithubOauthRedirectService,
                    GithubOauthRedirectCommandHandler,
                    GithubOauthCallbackHandler,
                    MeHandler,
                    {
                        provide: MountStorageService,
                        useValue: {
                            encryptionKey: "github-flow-encryption-key",
                        },
                    },
                    {
                        provide: SUPERJSON,
                        useValue: {
                            stringify: JSON.stringify,
                            parse: JSON.parse,
                        },
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            verifyRefreshToken: jest.fn().mockResolvedValue({
                                active: true,
                                sub: KEYCLOAK_ID,
                            }),
                        },
                    },
                    {
                        provide: GithubApiAuthService,
                        useValue: {
                            exchangeOAuthCodeForAccessToken: jest.fn().mockResolvedValue({
                                accessToken: "github-user-access-token",
                            }),
                            getAuthenticatedUser: jest.fn().mockResolvedValue({
                                user: {
                                    login: GITHUB_LOGIN,
                                },
                            }),
                        },
                    },
                ],
            })
            commandBus = world.app.get(CommandBus)
            queryBus = world.app.get(QueryBus)
            await world.truncate("users")
            learner = await world.entityManager.save(
                world.entityManager.create(UserEntity,
                    {
                        keycloakId: KEYCLOAK_ID,
                        email: "github-link@starci.test",
                        username: "github-link",
                    }),
            )
        })

        afterAll(async () => {
            await world?.close()
        })

        it("starts OAuth with an encrypted state bound to the authenticated learner",
            async () => {
                const redirected = await commandBus.execute(
                    new GithubOauthRedirectCommand({
                        refreshToken: "refresh-github-link",
                        redirectUri: RETURN_URI,
                    }),
                )
                const authorizationUrl = new URL(redirected.url)
                oauthState = authorizationUrl.searchParams.get("state") ?? ""

                expect(authorizationUrl.origin).toBe("https://github.com")
                expect(oauthState).not.toBe("")
                expect(oauthState).not.toContain(learner.id)
                expect(oauthState).not.toContain(RETURN_URI)
            })

        it("exchanges the callback code and persists the authenticated GitHub login",
            async () => {
                const callback = await commandBus.execute(
                    new GithubOauthCallbackCommand({
                        code: "github-oauth-code",
                        state: oauthState,
                    }),
                )
                expect(callback.redirectUri).toBe(RETURN_URI)

                learner = await world.entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: learner.id,
                        },
                    })
                expect(learner.githubUsername).toBe(GITHUB_LOGIN)
            })

        it("returns the linked GitHub identity from the authenticated profile",
            async () => {
                const me = await queryBus.execute(
                    new MeQuery({
                        request: undefined,
                        user: learner,
                    }),
                )

                expect(me.id).toBe(learner.id)
                expect(me.githubUsername).toBe(GITHUB_LOGIN)
            })
    })
