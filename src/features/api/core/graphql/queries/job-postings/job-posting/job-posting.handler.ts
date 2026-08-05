import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    JobPostingNotFoundException,
} from "@modules/platform/exceptions/errors/job-postings/job-posting-not-found"
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
    JobPostingQuery,
} from "./job-posting.query"

@QueryHandler(JobPostingQuery)
@Injectable()
/**
 * Fetches one job posting by its public `displayId`, resolving its employer
 * company eagerly so the FE can render name/logo/website without a second
 * round trip.
 */
export class JobPostingHandler
    extends ICQRSHandler<JobPostingQuery, JobPostingEntity>
    implements IQueryHandler<JobPostingQuery, JobPostingEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: JobPostingQuery,
    ): Promise<JobPostingEntity> {
        const {
            request: {
                displayId,
            },
        } = query.params

        // load by the public slug, eager-loading the employer company so the
        // detail page can render name/logo/websiteUrl in one round trip
        const jobPosting = await this.entityManager.findOne(
            JobPostingEntity,
            {
                where: {
                    displayId,
                },
                relations: {
                    company: true,
                },
            },
        )

        if (!jobPosting) {
            throw new JobPostingNotFoundException({
                displayId,
            })
        }

        return jobPosting
    }
}
