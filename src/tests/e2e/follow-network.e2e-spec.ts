import request from "supertest"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    SetFollowResolver,
} from "@features/api/core/graphql/mutations/follows/set-follow/set-follow.resolver"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    ActivityEntity,
} from "@modules/databases/postgresql/primary/entities/activity.entity"
import {
    NotificationEntity,
} from "@modules/databases/postgresql/primary/entities/notification.entity"
import {
    UserFollowEntity,
} from "@modules/databases/postgresql/primary/entities/user-follow.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

describe("a learner follows and unfollows another learner",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let actor: UserEntity | null = null
        let target: UserEntity
        const guard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!actor) return false
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = actor
                return true
            },
        }

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
                    SetFollowResolver,
                    UserStatsProjectionService,
                    NotificationService,
                    {
                        provide: EventEmitterService, useValue: {
                            emit: jest.fn().mockResolvedValue(undefined)
                        }
                    },
                ],
            }).overrideGuard(KeycloakAuthGraphQLGuard).useValue(guard).compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
        })

        afterAll(async () => app?.close().catch(() => undefined))
        beforeEach(async () => {
            await entityManager.query("TRUNCATE TABLE \"user_follows\", \"activities\", \"notifications\", \"user_stats_projections\", \"users\" RESTART IDENTITY CASCADE")
            actor = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `follower-${Date.now()}`, username: "follower"
                }))
            target = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `target-${Date.now()}`, username: "target"
                }))
        })

        const setFollow = (follow: boolean) => request(app.getHttpServer()).post("/graphql").send({
            query: `mutation { setFollow(request: { userId: "${target.id}", follow: ${follow} }) { success error } }`,
        })

        it("creates the edge, activity and notification, then removes only the edge",
            async () => {
                expect((await setFollow(true)).body).toHaveProperty("data.setFollow.success",
                    true)
                expect(await entityManager.count(UserFollowEntity)).toBe(1)
                expect(await entityManager.count(ActivityEntity)).toBe(1)
                expect(await entityManager.count(NotificationEntity)).toBe(1)

                expect((await setFollow(false)).body).toHaveProperty("data.setFollow.success",
                    true)
                expect(await entityManager.count(UserFollowEntity)).toBe(0)
                expect(await entityManager.count(ActivityEntity)).toBe(1)
            })
    })
