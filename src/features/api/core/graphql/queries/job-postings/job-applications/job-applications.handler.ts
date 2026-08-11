import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
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
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    JobApplicationsForbiddenException,
} from "@modules/platform/exceptions/errors/job-postings/job-application"
import {
    JobPostingNotFoundException,
} from "@modules/platform/exceptions/errors/job-postings/job-posting-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    JobApplicationsQuery,
} from "./job-applications.query"

@QueryHandler(JobApplicationsQuery)
@Injectable()
/** Returns applicants only when the caller submitted the posting. */
export class JobApplicationsHandler
    extends ICQRSHandler<JobApplicationsQuery, Array<JobApplicationEntity>>
    implements IQueryHandler<JobApplicationsQuery, Array<JobApplicationEntity>> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: JobApplicationsQuery,
    ): Promise<Array<JobApplicationEntity>> {
        const { request, user } = query.params
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
                relations: {
                    postedByUser: true,
                },
            },
        )
        if (!posting) {
            throw new JobPostingNotFoundException({
                id: request.jobPostingId,
            })
        }
        if (posting.postedByUser?.id !== user.id) {
            throw new JobApplicationsForbiddenException({
                jobPostingId: posting.id,
                userId: user.id,
            })
        }
        return this.entityManager.find(
            JobApplicationEntity,
            {
                where: {
                    jobPosting: {
                        id: posting.id,
                    },
                },
                relations: {
                    applicant: true,
                },
                order: {
                    createdAt: "DESC",
                },
            },
        )
    }
}
