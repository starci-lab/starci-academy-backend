import {
    CommandBus,
    QueryBus,
} from "@nestjs/cqrs"
import {
    ApplyToJobCommand,
} from "@features/api/core/graphql/mutations/job-postings/apply-to-job/apply-to-job.command"
import {
    ApplyToJobHandler,
} from "@features/api/core/graphql/mutations/job-postings/apply-to-job/apply-to-job.handler"
import {
    JobApplicationsHandler,
} from "@features/api/core/graphql/queries/job-postings/job-applications/job-applications.handler"
import {
    JobApplicationsQuery,
} from "@features/api/core/graphql/queries/job-postings/job-applications/job-applications.query"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"
import {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import type {
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
    JobApplicationsForbiddenException,
} from "@modules/platform/exceptions/errors/job-postings/job-application"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/** A learner applies internally and only the posting submitter sees the application. */
describe("an internal job application reaches its posting owner",
    () => {
        let world: FlowWorld
        let commandBus: CommandBus
        let queryBus: QueryBus
        let owner: UserEntity
        let applicant: UserEntity
        let stranger: UserEntity
        let posting: JobPostingEntity

        beforeAll(async () => {
            world = await bootFlowWorld({
                providers: [
                    ApplyToJobHandler,
                    JobApplicationsHandler,
                ],
            })
            commandBus = world.app.get(CommandBus)
            queryBus = world.app.get(QueryBus)
        })

        afterAll(async () => {
            await world.close()
        })

        beforeEach(async () => {
            await world.truncate(
                "job_applications",
                "job_postings",
                "headhunting_companies",
                "users",
            )
            owner = await world.mintLearner("posting-owner")
            applicant = await world.mintLearner("job-applicant")
            stranger = await world.mintLearner("application-stranger")
            const company = await world.entityManager.save(
                HeadhuntingCompanyEntity,
                {
                    title: "Flow Systems",
                    displayId: `flow-systems-${Date.now()}`,
                    defaultLocale: Locale.En,
                },
            )
            posting = await world.entityManager.save(
                JobPostingEntity,
                {
                    title: "Platform Engineer",
                    displayId: `platform-engineer-${Date.now()}`,
                    company,
                    postedByUser: owner,
                    applyMethod: JobApplyMethod.Internal,
                    source: JobPostingSource.Submitted,
                },
            )
        })

        it("persists one application when a learner retries the command",
            async () => {
                const params = {
                    request: {
                        jobPostingId: posting.id,
                        coverLetter: "I have operated distributed systems.",
                    },
                    user: applicant,
                }

                const first = await commandBus.execute(new ApplyToJobCommand(params))
                const retried = await commandBus.execute(new ApplyToJobCommand(params))

                expect(retried.id).toBe(first.id)
                expect(await world.entityManager.count(JobApplicationEntity)).toBe(1)
            })

        it("lets the posting submitter read the applicant but denies a stranger",
            async () => {
                await commandBus.execute(new ApplyToJobCommand({
                    request: {
                        jobPostingId: posting.id,
                    },
                    user: applicant,
                }))

                const applications = await queryBus.execute(new JobApplicationsQuery({
                    request: {
                        jobPostingId: posting.id,
                    },
                    user: owner,
                }))

                expect(applications).toHaveLength(1)
                expect(applications[0].applicant.id).toBe(applicant.id)
                await expect(queryBus.execute(new JobApplicationsQuery({
                    request: {
                        jobPostingId: posting.id,
                    },
                    user: stranger,
                }))).rejects.toBeInstanceOf(JobApplicationsForbiddenException)
            })
    })
