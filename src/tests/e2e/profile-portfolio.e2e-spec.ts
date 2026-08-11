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
    UserPinnedProjectEntity
} from "@modules/databases/postgresql/primary/entities/user-pinned-project.entity"
import {
    PrimaryPostgreSQLModule
} from "@modules/databases/postgresql/primary/primary.module"
import {
    GraphQLProfileVisibilityGuard
} from "@modules/bussiness/guards/graphql-profile-visibility.guard"
import {
    UserPinnedProjectsProjectionService
} from "@modules/bussiness/projections/user-pinned-projects/user-pinned-projects-projection.service"
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
    PinExternalProjectResolver
} from "@features/api/core/graphql/mutations/profile/pin-external-project/pin-external-project.resolver"
import {
    ReorderPinnedProjectsResolver
} from "@features/api/core/graphql/mutations/profile/reorder-pinned-projects/reorder-pinned-projects.resolver"
import {
    UnpinProjectResolver
} from "@features/api/core/graphql/mutations/profile/unpin-project/unpin-project.resolver"
import {
    UserPinnedProjectsResolver
} from "@features/api/core/graphql/queries/users/user-pinned-projects/user-pinned-projects.resolver"
import {
    TestHelpersModule
} from "@tests/helpers/test-helpers.module"

/** A learner pins, orders, publishes, and removes projects from the public portfolio. */
describe("a learner manages the projects published on their portfolio",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        const pinIds: Array<string> = []
        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                GqlExecutionContext.create(context).getContext<{ req: { user?: UserEntity } }>().req.user = learner
                return true
            },
        }
        const publicGuard: CanActivate = {
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
                    PinExternalProjectResolver,
                    ReorderPinnedProjectsResolver,
                    UnpinProjectResolver,
                    UserPinnedProjectsResolver,
                    UserPinnedProjectsProjectionService,
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
                .overrideGuard(KeycloakOptionalAuthGraphQLGuard).useValue(publicGuard)
                .overrideGuard(GraphQLProfileVisibilityGuard).useValue(publicGuard)
                .compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
            await entityManager.query("TRUNCATE TABLE \"user_pinned_projects_projections\", \"user_pinned_projects\", \"users\" RESTART IDENTITY CASCADE")
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "kc-profile-portfolio", username: "portfolio-author", profileLocked: false,
                }))
        })

        afterAll(async () => { await app?.close().catch(() => undefined) })

        it("pins two external projects through GraphQL",
            async () => {
                for (const project of [
                    {
                        title: "Compiler", url: "https://example.com/compiler", techStack: ["TypeScript"]
                    },
                    {
                        title: "Database", url: "https://example.com/database", techStack: ["PostgreSQL"]
                    },
                ]) {
                    const response = await gql(`mutation Pin($request: PinExternalProjectRequest!) {
                pinExternalProject(request: $request) { success data }
            }`,
                    {
                        request: project
                    })
                    pinIds.push(response.body.data.pinExternalProject.data)
                }
                expect(await entityManager.count(UserPinnedProjectEntity)).toBe(2)
            })

        it("reorders the portfolio atomically",
            async () => {
                const response = await gql(`mutation Reorder($request: ReorderPinnedProjectsRequest!) {
            reorderPinnedProjects(request: $request) { success }
        }`,
                {
                    request: {
                        ids: [pinIds[1],
                            pinIds[0]]
                    }
                })
                expect(response.body.data.reorderPinnedProjects.success).toBe(true)
                const rows = await entityManager.find(UserPinnedProjectEntity,
                    {
                        order: {
                            orderIndex: "ASC"
                        }
                    })
                expect(rows.map((row) => row.id)).toEqual([pinIds[1],
                    pinIds[0]])
            })

        it("serves the ordered projects through the public portfolio query",
            async () => {
                const response = await gql(`query Portfolio($userId: ID!) {
            userPinnedProjects(userId: $userId) { success data { id title orderIndex isVerified } }
        }`,
                {
                    userId: learner.id
                })
                expect(response.body.errors).toBeUndefined()
                expect(response.body.data.userPinnedProjects.data.map((pin: { id: string }) => pin.id)).toEqual([pinIds[1],
                    pinIds[0]])
            })

        it("unpins a project and removes it from persisted portfolio state",
            async () => {
                const response = await gql(`mutation Unpin($request: UnpinProjectRequest!) {
            unpinProject(request: $request) { success }
        }`,
                {
                    request: {
                        id: pinIds[0]
                    }
                })
                expect(response.body.data.unpinProject.success).toBe(true)
                const rows = await entityManager.find(UserPinnedProjectEntity)
                expect(rows.map((row) => row.id)).toEqual([pinIds[1]])
            })
    })
