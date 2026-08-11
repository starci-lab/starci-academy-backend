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
    BuyStreakFreezeResolver,
} from "@features/api/core/graphql/mutations/streak/buy-streak-freeze/buy-streak-freeze.resolver"
import {
    StreakService,
} from "@modules/bussiness/streak/streak.service"
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
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

describe("a learner buys a streak freeze",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity | null = null
        const guard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!learner) return false
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = learner
                return true
            },
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    StreakService,
                    BuyStreakFreezeResolver,
                ],
            }).overrideGuard(KeycloakAuthGraphQLGuard).useValue(guard).compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
        })

        afterAll(async () => app?.close().catch(() => undefined))
        beforeEach(async () => {
            await entityManager.query("TRUNCATE TABLE \"users\" RESTART IDENTITY CASCADE")
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `streak-freeze-${Date.now()}`,
                    coinBalance: 200,
                    streakFreezes: 0,
                }))
        })

        it("spends coin and adds one freeze through the GraphQL mutation",
            async () => {
                const response = await request(app.getHttpServer()).post("/graphql").send({
                    query: "mutation { buyStreakFreeze { success error data { coinBalance streakFreezes } } }",
                })
                expect(response.body).toHaveProperty("data.buyStreakFreeze.success",
                    true)
                const persisted = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner?.id,
                    })
                expect(persisted.coinBalance).toBe(100)
                expect(persisted.streakFreezes).toBe(1)
            })
    })
