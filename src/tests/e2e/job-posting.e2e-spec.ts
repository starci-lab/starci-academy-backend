import request from "supertest"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
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
    SubmitJobPostingResolver,
} from "@features/api/core/graphql/mutations/job-postings/submit-job-posting/submit-job-posting.resolver"
import {
    JobPostingHandler,
} from "@features/api/core/graphql/queries/job-postings/job-posting/job-posting.handler"
import {
    JobPostingResolver,
} from "@features/api/core/graphql/queries/job-postings/job-posting/job-posting.resolver"
import {
    JobPostingService,
} from "@features/api/core/graphql/queries/job-postings/job-posting/job-posting.service"
import {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    JobPostingSource,
} from "@modules/databases/postgresql/primary/enums/job-posting-source"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

describe("a company publishes a job that becomes publicly visible",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let companyUser: UserEntity | null = null
        const guard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!companyUser) return false
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = companyUser
                return true
            },
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    CqrsModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic, useServices: false
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true, withHydration: false, withResolvers: false
                    }),
                ],
                providers: [
                    SubmitJobPostingResolver,
                    JobPostingHandler,
                    JobPostingService,
                    JobPostingResolver,
                ],
            }).overrideGuard(KeycloakAuthGraphQLGuard).useValue(guard).compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
        })

        afterAll(async () => app?.close().catch(() => undefined))
        beforeEach(async () => {
            await entityManager.query("TRUNCATE TABLE \"job_postings\", \"headhunting_companies\", \"users\" RESTART IDENTITY CASCADE")
            companyUser = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `job-poster-${Date.now()}`
                }))
        })

        it("creates the posting through its mutation and reads it through the public query",
            async () => {
                const created = await request(app.getHttpServer()).post("/graphql").send({
                    query: `mutation {
                        submitJobPosting(request: {
                            title: "Platform Engineer"
                            description: "Build the learning platform"
                            applyMethod: external_url
                            applyUrl: "https://example.com/apply"
                            newCompany: { title: "Flow Systems" }
                        }) { success error data }
                    }`,
                })
                expect(created.body).toHaveProperty("data.submitJobPosting.success",
                    true)
                const posting = await entityManager.findOneByOrFail(JobPostingEntity,
                    {
                        id: created.body.data.submitJobPosting.data as string
                    })
                expect(posting.source).toBe(JobPostingSource.Submitted)

                const visible = await request(app.getHttpServer()).post("/graphql").send({
                    query: `query { jobPosting(displayId: "${posting.displayId}") { success error data { id displayId title company { title } } } }`,
                })
                expect(visible.body).toHaveProperty("data.jobPosting.data.id",
                    posting.id)
                expect(visible.body).toHaveProperty("data.jobPosting.data.company.title",
                    "Flow Systems")
            })
    })
