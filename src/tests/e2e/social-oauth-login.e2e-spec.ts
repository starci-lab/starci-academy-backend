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
    JwtService
} from "@nestjs/jwt"
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
    AuthenticationType
} from "@modules/databases/postgresql/primary/enums/authentication-type"
import {
    PrimaryPostgreSQLModule
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakOidcRedirectService
} from "@modules/integrations/keycloak/keycloak-oidc-redirect.service"
import {
    KeycloakTokenService
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakGoogleRedirectController
} from "@features/api/core/http/keycloak/google/redirect/redirect.controller"
import {
    KeycloakGoogleCallbackController
} from "@features/api/core/http/keycloak/google/callback/callback.controller"
import {
    KeycloakGoogleCallbackService
} from "@features/api/core/http/keycloak/google/callback/callback.service"
import {
    KeycloakGoogleCallbackHandler
} from "@features/api/core/http/keycloak/google/callback/callback.handler"
import {
    TestHelpersModule
} from "@tests/helpers/test-helpers.module"

/** A stranger signs in with Google and receives a local StarCI identity. */
describe("a stranger signs in through social OAuth and becomes a local learner",
    () => {
        const KEYCLOAK_ID = "kc-google-social-login"
        const ACCESS_TOKEN = "google-access-token"
        const REFRESH_TOKEN = "google-refresh-token"
        let app: INestApplication
        let entityManager: EntityManager

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true, withHydration: false, withResolvers: false
                    }),
                    CqrsModule,
                ],
                controllers: [KeycloakGoogleRedirectController,
                    KeycloakGoogleCallbackController],
                providers: [
                    KeycloakGoogleCallbackService,
                    KeycloakGoogleCallbackHandler,
                    {
                        provide: KeycloakOidcRedirectService, useValue: {
                            buildAuthorizeRedirectUrl: jest.fn().mockResolvedValue("https://identity.starci.test/authorize?state=google-state&code_challenge=pkce"),
                        }
                    },
                    {
                        provide: KeycloakTokenService, useValue: {
                            exchangeCodeForToken: jest.fn().mockResolvedValue({
                                access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN
                            }),
                        }
                    },
                    {
                        provide: JwtService, useValue: {
                            decode: jest.fn().mockReturnValue({
                                sub: KEYCLOAK_ID, email: "social-learner@starci.test", preferred_username: "social-learner",
                            })
                        }
                    },
                ],
            }).compile()
            app = moduleRef.createNestApplication()
            app.enableVersioning({
                type: VersioningType.URI
            })
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
            await entityManager.query("TRUNCATE TABLE \"users\" RESTART IDENTITY CASCADE")
        })

        afterAll(async () => { await app?.close().catch(() => undefined) })

        it("starts Google login through the browser redirect endpoint",
            async () => {
                const response = await request(app.getHttpServer())
                    .get("/v1/keycloak/google/redirect")
                    .query({
                        redirect_uri: "https://academy.starci.test/auth/callback"
                    })
                    .expect(302)
                expect(response.headers.location).toContain("https://identity.starci.test/authorize")
                expect(response.headers.location).toContain("code_challenge=pkce")
            })

        it("exchanges the provider callback through HTTP and returns a session",
            async () => {
                const response = await request(app.getHttpServer())
                    .get("/v1/keycloak/google/callback")
                    .query({
                        code: "provider-code", session_state: "provider-session", iss: "https://identity.starci.test"
                    })
                    .expect(200)
                expect(response.body.data.accessToken).toBe(ACCESS_TOKEN)
                expect(response.body.data.refreshToken).toBe(REFRESH_TOKEN)
            })

        it("persists the Google-backed local identity exactly once",
            async () => {
                const user = await entityManager.findOneByOrFail(UserEntity,
                    {
                        keycloakId: KEYCLOAK_ID
                    })
                expect(user.email).toBe("social-learner@starci.test")
                expect(user.authenticationType).toBe(AuthenticationType.Google)
                expect(await entityManager.count(UserEntity,
                    {
                        where: {
                            keycloakId: KEYCLOAK_ID
                        }
                    })).toBe(1)
            })
    })
