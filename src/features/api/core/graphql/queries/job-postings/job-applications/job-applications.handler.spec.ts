import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"
import type {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    JobApplicationsForbiddenException,
} from "@modules/platform/exceptions/errors/job-postings/job-application"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    JobApplicationsHandler,
} from "./job-applications.handler"
import {
    JobApplicationsQuery,
} from "./job-applications.query"

const POSTGRESQL_PRIMARY = "primary"

describe("JobApplicationsHandler",
    () => {
        let handler: JobApplicationsHandler
        let entityManager: EntityManagerMock

        const owner = {
            id: "owner-1",
        } as UserEntity

        const query = (
            user: UserEntity = owner,
        ): JobApplicationsQuery => new JobApplicationsQuery({
            request: {
                jobPostingId: "posting-1",
            },
            user,
        })

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            const moduleRef = await Test.createTestingModule({
                providers: [
                    JobApplicationsHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()
            handler = moduleRef.get(JobApplicationsHandler)
        })

        it("returns applicants to the posting submitter",
            async () => {
                const applications = [
                    {
                        id: "application-1",
                    } as JobApplicationEntity,
                ]
                entityManager.findOne.mockResolvedValueOnce({
                    id: "posting-1",
                    postedByUser: owner,
                } as JobPostingEntity)
                entityManager.find.mockResolvedValueOnce(applications)

                await expect(handler.execute(query())).resolves.toBe(applications)
            })

        it("does not expose applicants to another signed-in user",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "posting-1",
                    postedByUser: owner,
                } as JobPostingEntity)

                await expect(handler.execute(query({
                    id: "stranger-1",
                } as UserEntity))).rejects.toBeInstanceOf(
                    JobApplicationsForbiddenException,
                )
                expect(entityManager.find).not.toHaveBeenCalled()
            })
    })
