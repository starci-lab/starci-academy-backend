import request from "supertest"
import {
    Test
} from "@nestjs/testing"
import type {
    INestApplication, CanActivate, ExecutionContext
} from "@nestjs/common"
import {
    GqlExecutionContext
} from "@nestjs/graphql"
import {
    getEntityManagerToken
} from "@nestjs/typeorm"
import type {
    EntityManager
} from "typeorm"
import {
    ApolloServerModule
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType
} from "@modules/api/apollo/server/enums/server"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    PrimaryPostgreSQLModule
} from "@modules/databases/postgresql/primary/primary.module"
import {
    UserService
} from "@modules/bussiness/user/user.service"
import {
    KeycloakAuthGraphQLGuard
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakOptionalAuthGraphQLGuard
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    KeycloakJwksService
} from "@modules/integrations/keycloak/jwks.service"
import {
    SessionService
} from "@modules/platform/session/session.service"
import {
    CookieService
} from "@modules/platform/cookie/cookie.service"
import {
    UpdateProfileResolver
} from "@features/api/core/graphql/mutations/profile/update-profile/update-profile.resolver"
import {
    UserProfileResolver
} from "@features/api/core/graphql/queries/users/user-profile/user-profile.resolver"
import {
    TestHelpersModule
} from "@tests/helpers/test-helpers.module"

/** A learner publishes profile changes and visitors read the persisted public identity. */
describe("a learner publishes profile changes for public visitors",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                GqlExecutionContext.create(context).getContext<{ req: { user?: UserEntity } }>().req.user = learner
                return true
            },
        }
        const optionalGuard: CanActivate = {
            canActivate: () => true
        }
        const gql = (query: string, variables: Record<string, unknown> = {
        }) =>
            request(app.getHttpServer()).post("/graphql").send({
                query, variables
            })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic, useServices: false
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true, withHydration: false, withResolvers: false
                    }),
                ],
                providers: [
                    UpdateProfileResolver,
                    UserProfileResolver,
                    {
                        provide: UserService, useValue: {
                            invalidateProfileLocked: jest.fn().mockResolvedValue(undefined)
                        }
                    },
                    {
                        provide: KeycloakJwksService, useValue: {
                        }
                    },
                    {
                        provide: SessionService, useValue: {
                        }
                    },
                    {
                        provide: CookieService, useValue: {
                        }
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard).useValue(authGuard)
                .overrideGuard(KeycloakOptionalAuthGraphQLGuard).useValue(optionalGuard)
                .compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
            await entityManager.query("TRUNCATE TABLE \"users\" RESTART IDENTITY CASCADE")
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-profile-publication", username: "profile-author", displayName: "Old Name", bio: "Old bio", profileLocked: false,
                }))
        })

        afterAll(async () => { await app?.close().catch(() => undefined) })

        it("publishes a partial profile update through GraphQL",
            async () => {
                const response = await gql(`mutation Update($request: UpdateProfileRequest!) {
            updateProfile(request: $request) { success data { id displayName bio roleTitle profileLocked } }
        }`,
                {
                    request: {
                        displayName: "  New Name  ", roleTitle: "Backend Engineer"
                    }
                })
                expect(response.body.data.updateProfile.data.displayName).toBe("New Name")
                expect(response.body.data.updateProfile.data.bio).toBe("Old bio")
                learner = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id
                    })
                expect(learner.roleTitle).toBe("Backend Engineer")
            })

        it("allows an explicit null to clear a previously published field",
            async () => {
                const response = await gql(`mutation Update($request: UpdateProfileRequest!) {
            updateProfile(request: $request) { success data { roleTitle } }
        }`,
                {
                    request: {
                        roleTitle: null
                    }
                })
                expect(response.body.data.updateProfile.data.roleTitle).toBeNull()
                learner = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id
                    })
                expect(learner.roleTitle).toBeNull()
            })

        it("serves the persisted profile through the public GraphQL query",
            async () => {
                const response = await gql(`query Profile($username: String!) {
            userProfile(username: $username) { success data { id username displayName bio roleTitle } }
        }`,
                {
                    username: learner.username
                })
                expect(response.body.errors).toBeUndefined()
                expect(response.body.data.userProfile.data).toEqual(expect.objectContaining({
                    id: learner.id, username: "profile-author", displayName: "New Name", bio: "Old bio", roleTitle: null,
                }))
            })
    })
