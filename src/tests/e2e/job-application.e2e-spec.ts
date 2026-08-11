import request from "supertest"
import type {
    CanActivate,
    ExecutionContext,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    ApplyToJobHandler,
} from "@features/api/core/graphql/mutations/job-postings/apply-to-job/apply-to-job.handler"
import {
    ApplyToJobResolver,
} from "@features/api/core/graphql/mutations/job-postings/apply-to-job/apply-to-job.resolver"
import {
    ApplyToJobService,
} from "@features/api/core/graphql/mutations/job-postings/apply-to-job/apply-to-job.service"
import {
    JobApplicationsHandler,
} from "@features/api/core/graphql/queries/job-postings/job-applications/job-applications.handler"
import {
    JobApplicationsResolver,
} from "@features/api/core/graphql/queries/job-postings/job-applications/job-applications.resolver"
import {
    JobApplicationsService,
} from "@features/api/core/graphql/queries/job-postings/job-applications/job-applications.service"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"
import {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    JobApplyMethod,
} from "@modules/databases/postgresql/primary/enums/job-apply-method"
import {
    JobPostingSource,
} from "@modules/databases/postgresql/primary/enums/job-posting-source"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

interface JobApplicationGraphQLBody extends Record<string, unknown> {
    data?: {
        applyToJob?: {
            data?: {
                id?: string
            }
        }
    }
}

/** A learner applies through GraphQL and only the posting submitter sees the application. */
describe("an internal job application reaches its posting owner",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let currentUser: UserEntity | null = null
        let owner: UserEntity
        let applicant: UserEntity
        let stranger: UserEntity
        let posting: JobPostingEntity

        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!currentUser) {
                    return false
                }
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                    .req.user = currentUser
                return true
            },
        }

        const graphql = async (query: string): Promise<JobApplicationGraphQLBody> => {
            const response = await request(app.getHttpServer())
                .post("/graphql")
                .send({
                    query
                })
            return response.body as JobApplicationGraphQLBody
        }

        const apply = async (): Promise<JobApplicationGraphQLBody> => graphql(`
            mutation {
                applyToJob(request: {
                    jobPostingId: "${posting.id}"
                    coverLetter: "I have operated distributed systems."
                }) { success error data { id } }
            }
        `)

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    CqrsModule,
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
                    ApplyToJobHandler,
                    ApplyToJobService,
                    ApplyToJobResolver,
                    JobApplicationsHandler,
                    JobApplicationsService,
                    JobApplicationsResolver,
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(authGuard)
                .compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
        })

        afterAll(async () => app?.close().catch(() => undefined))

        beforeEach(async () => {
            await entityManager.query("TRUNCATE TABLE \"job_applications\", \"job_postings\", \"headhunting_companies\", \"users\" RESTART IDENTITY CASCADE")
            currentUser = null
            const mint = (name: string): Promise<UserEntity> => entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${name}-${Date.now()}`,
                    }),
            )
            owner = await mint("posting-owner")
            applicant = await mint("job-applicant")
            stranger = await mint("application-stranger")
            const company = await entityManager.save(HeadhuntingCompanyEntity,
                {
                    title: "Flow Systems",
                    displayId: `flow-systems-${Date.now()}`,
                    defaultLocale: Locale.En,
                })
            posting = await entityManager.save(JobPostingEntity,
                {
                    title: "Platform Engineer",
                    displayId: `platform-engineer-${Date.now()}`,
                    company,
                    postedByUser: owner,
                    applyMethod: JobApplyMethod.Internal,
                    source: JobPostingSource.Submitted,
                })
        })

        it("persists one application when a learner retries the mutation",
            async () => {
                currentUser = applicant
                const first = await apply()
                const retried = await apply()

                expect(first).toHaveProperty("data.applyToJob.data.id")
                expect(retried).toHaveProperty("data.applyToJob.data.id",
                    first.data?.applyToJob?.data?.id)
                expect(await entityManager.count(JobApplicationEntity)).toBe(1)
            })

        it("lets the posting submitter read the applicant but denies a stranger",
            async () => {
                currentUser = applicant
                await apply()

                currentUser = owner
                const allowed = await graphql(`query { jobApplications(jobPostingId: "${posting.id}") { success error data { id applicant { id } } } }`)
                expect(allowed).toHaveProperty("data.jobApplications.data.0.applicant.id",
                    applicant.id)

                currentUser = stranger
                const denied = await graphql(`query { jobApplications(jobPostingId: "${posting.id}") { success error data { id } } }`)
                expect(denied).toHaveProperty("data.jobApplications.success",
                    false)
            })
    })
