import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"
import type {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    JobApplicationStatus,
} from "@modules/databases/postgresql/primary/enums/job-application-status"
import {
    JobApplyMethod,
} from "@modules/databases/postgresql/primary/enums/job-apply-method"
import {
    JobPostingDoesNotAcceptInternalApplicationsException,
} from "@modules/platform/exceptions/errors/job-postings/job-application"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    ApplyToJobCommand,
} from "./apply-to-job.command"
import {
    ApplyToJobHandler,
} from "./apply-to-job.handler"

const POSTGRESQL_PRIMARY = "primary"

describe("ApplyToJobHandler",
    () => {
        let handler: ApplyToJobHandler
        let entityManager: EntityManagerMock

        const applicant = {
            id: "applicant-1",
        } as UserEntity

        const posting = (
            applyMethod: JobApplyMethod = JobApplyMethod.Internal,
        ): JobPostingEntity => ({
            id: "posting-1",
            applyMethod,
            expiresAt: null,
        } as JobPostingEntity)

        const command = (): ApplyToJobCommand => new ApplyToJobCommand({
            request: {
                jobPostingId: "posting-1",
                coverLetter: "  I build reliable systems.  ",
            },
            user: applicant,
        })

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            const moduleRef = await Test.createTestingModule({
                providers: [
                    ApplyToJobHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()
            handler = moduleRef.get(ApplyToJobHandler)
        })

        it("persists one normalized internal application",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce(posting())
                    .mockResolvedValueOnce(null)

                const result = await handler.execute(command())

                expect(result).toMatchObject({
                    applicant,
                    coverLetter: "I build reliable systems.",
                    status: JobApplicationStatus.Submitted,
                })
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.objectContaining({
                        applicant,
                        coverLetter: "I build reliable systems.",
                    }),
                )
            })

        it("returns the existing row when the applicant retries",
            async () => {
                const existing = {
                    id: "application-1",
                } as JobApplicationEntity
                entityManager.findOne
                    .mockResolvedValueOnce(posting())
                    .mockResolvedValueOnce(existing)

                await expect(handler.execute(command())).resolves.toBe(existing)
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("refuses a posting whose application leaves the platform",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(posting(JobApplyMethod.ExternalUrl))

                await expect(handler.execute(command()))
                    .rejects.toBeInstanceOf(
                        JobPostingDoesNotAcceptInternalApplicationsException,
                    )
                expect(entityManager.save).not.toHaveBeenCalled()
            })
    })
