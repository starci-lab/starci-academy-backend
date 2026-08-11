import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"
import {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import {
    JobApplicationStatus,
} from "@modules/databases/postgresql/primary/enums/job-application-status"
import {
    JobApplyMethod,
} from "@modules/databases/postgresql/primary/enums/job-apply-method"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    JobPostingDoesNotAcceptInternalApplicationsException,
} from "@modules/platform/exceptions/errors/job-postings/job-application"
import {
    JobPostingNotFoundException,
} from "@modules/platform/exceptions/errors/job-postings/job-posting-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    ApplyToJobCommand,
} from "./apply-to-job.command"

@CommandHandler(ApplyToJobCommand)
@Injectable()
/** Persists one idempotent application only for a live internal posting. */
export class ApplyToJobHandler
    extends ICQRSHandler<ApplyToJobCommand, JobApplicationEntity>
    implements ICommandHandler<ApplyToJobCommand, JobApplicationEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(command: ApplyToJobCommand): Promise<JobApplicationEntity> {
        const { request, user } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const posting = await this.entityManager.findOne(
            JobPostingEntity,
            {
                where: {
                    id: request.jobPostingId,
                },
            },
        )
        if (!posting) {
            throw new JobPostingNotFoundException({
                id: request.jobPostingId,
            })
        }
        if (
            posting.applyMethod !== JobApplyMethod.Internal
            || (posting.expiresAt !== null && posting.expiresAt.getTime() <= Date.now())
        ) {
            throw new JobPostingDoesNotAcceptInternalApplicationsException({
                jobPostingId: posting.id,
            })
        }
        const existing = await this.entityManager.findOne(
            JobApplicationEntity,
            {
                where: {
                    jobPosting: {
                        id: posting.id,
                    },
                    applicant: {
                        id: user.id,
                    },
                },
                relations: {
                    applicant: true,
                },
            },
        )
        if (existing) {
            return existing
        }
        const application = this.entityManager.create(
            JobApplicationEntity,
            {
                jobPosting: posting,
                applicant: user,
                coverLetter: request.coverLetter?.trim() || null,
                status: JobApplicationStatus.Submitted,
            },
        )
        return this.entityManager.save(application)
    }
}
