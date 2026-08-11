import request from "supertest"
import {
    Test
} from "@nestjs/testing"
import {
    VersioningType
} from "@nestjs/common"
import type {
    INestApplication
} from "@nestjs/common"
import {
    CqrsModule
} from "@nestjs/cqrs"
import {
    getEntityManagerToken
} from "@nestjs/typeorm"
import type {
    EntityManager
} from "typeorm"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    PrimaryPostgreSQLModule
} from "@modules/databases/postgresql/primary/primary.module"
import {
    EncryptionService
} from "@modules/crypto/encryption.service"
import {
    MountStorageService
} from "@modules/filesystem/mount-storage.service"
import {
    GithubApiAuthService
} from "@modules/integrations/github/auth.service"
import {
    GithubOauthRedirectService
} from "@modules/integrations/github/oauth-redirect.service"
import {
    CacheService
} from "@modules/integrations/cache/cache.service"
import {
    KeycloakTokenService
} from "@modules/integrations/keycloak/token.service"
import {
    SUPERJSON
} from "@modules/lib/mixin/constants/superjson"
import {
    UserService
} from "@modules/bussiness/user/user.service"
import {
    GithubOauthRedirectController
} from "@features/api/core/http/github/oauth/redirect/redirect.controller"
import {
    GithubOauthRedirectCommandService
} from "@features/api/core/http/github/oauth/redirect/redirect.service"
import {
    GithubOauthRedirectCommandHandler
} from "@features/api/core/http/github/oauth/redirect/redirect.handler"
import {
    GithubOauthCallbackController
} from "@features/api/core/http/github/oauth/callback/callback.controller"
import {
    GithubOauthCallbackService
} from "@features/api/core/http/github/oauth/callback/callback.service"
import {
    GithubOauthCallbackHandler
} from "@features/api/core/http/github/oauth/callback/callback.handler"
import {
    TestHelpersModule
} from "@tests/helpers/test-helpers.module"

jest.mock("octokit",
    () => ({
        Octokit: jest.fn()
    }))

/** A learner completes GitHub OAuth through both browser HTTP redirects. */
describe("a learner links GitHub and sees the linked identity persisted",
    () => {
        const KEYCLOAK_ID = "kc-github-account-link-flow"
        const GITHUB_LOGIN = "starci-learner"
        const RETURN_URI = "https://academy.starci.test/settings/integrations"
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let oauthState: string

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true, withHydration: false, withResolvers: false
                    }),
                    CqrsModule,
                ],
                controllers: [GithubOauthRedirectController,
                    GithubOauthCallbackController],
                providers: [
                    UserService,
                    EncryptionService,
                    GithubOauthRedirectService,
                    GithubOauthRedirectCommandService,
                    GithubOauthRedirectCommandHandler,
                    GithubOauthCallbackService,
                    GithubOauthCallbackHandler,
                    {
                        provide: MountStorageService, useValue: {
                            encryptionKey: "github-flow-encryption-key"
                        }
                    },
                    {
                        provide: CacheService, useValue: {
                            get: jest.fn().mockResolvedValue(undefined),
                            set: jest.fn().mockResolvedValue(undefined),
                            del: jest.fn().mockResolvedValue(undefined),
                        }
                    },
                    {
                        provide: SUPERJSON, useValue: {
                            stringify: JSON.stringify, parse: JSON.parse
                        }
                    },
                    {
                        provide: KeycloakTokenService, useValue: {
                            verifyRefreshToken: jest.fn().mockResolvedValue({
                                active: true, sub: KEYCLOAK_ID
                            })
                        }
                    },
                    {
                        provide: GithubApiAuthService, useValue: {
                            exchangeOAuthCodeForAccessToken: jest.fn().mockResolvedValue({
                                accessToken: "github-user-access-token"
                            }),
                            getAuthenticatedUser: jest.fn().mockResolvedValue({
                                user: {
                                    login: GITHUB_LOGIN
                                }
                            }),
                        }
                    },
                ],
            }).compile()
            app = moduleRef.createNestApplication()
            app.enableVersioning({
                type: VersioningType.URI
            })
            app.use((req: { headers: { cookie?: string }, cookies?: Record<string, string> }, _res: unknown, next: () => void) => {
                req.cookies = {
                    keycloak_refresh_token: "refresh-github-link"
                }
                next()
            })
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
            await entityManager.query("TRUNCATE TABLE \"users\" RESTART IDENTITY CASCADE")
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: KEYCLOAK_ID, email: "github-link@starci.test", username: "github-link",
                }))
        })

        afterAll(async () => { await app?.close().catch(() => undefined) })

        it("starts OAuth with an encrypted state bound to the authenticated learner",
            async () => {
                const response = await request(app.getHttpServer())
                    .get("/v1/github/oauth/redirect")
                    .query({
                        redirectUri: RETURN_URI
                    })
                    .expect(302)
                const authorizationUrl = new URL(response.headers.location)
                oauthState = authorizationUrl.searchParams.get("state") ?? ""
                expect(authorizationUrl.origin).toBe("https://github.com")
                expect(oauthState).not.toBe("")
                expect(oauthState).not.toContain(learner.id)
                expect(oauthState).not.toContain(RETURN_URI)
            })

        it("exchanges the callback code and redirects to the requested frontend page",
            async () => {
                const response = await request(app.getHttpServer())
                    .get("/v1/github/oauth/callback")
                    .query({
                        code: "github-oauth-code", state: oauthState
                    })
                    .expect(302)
                expect(response.headers.location).toBe(RETURN_URI)
            })

        it("persists the authenticated GitHub login on the learner",
            async () => {
                learner = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id
                    })
                expect(learner.githubUsername).toBe(GITHUB_LOGIN)
            })
    })
