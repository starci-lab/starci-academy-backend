import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    JobPostingEntity,
} from "@modules/databases"
import {
    JobPostingNotFoundException,
} from "@modules/exceptions"
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

/**
 * Fetches one job posting by its public `displayId`, resolving its employer
 * company eagerly so the FE can render name/logo/website without a second
 * round trip.
 */
@QueryHandler(JobPostingQuery)
@Injectable()
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
