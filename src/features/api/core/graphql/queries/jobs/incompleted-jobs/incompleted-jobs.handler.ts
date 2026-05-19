import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
    JobStatus,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    In,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    IncompletedJobsQuery,
} from "./incompleted-jobs.query"
import {
    IncompletedJobItem,
    IncompletedJobsResponseData,
} from "./graphql-types"
import {
    UserNotFoundException
} from "@modules/exceptions"

@QueryHandler(IncompletedJobsQuery)
@Injectable()
export class IncompletedJobsHandler
    extends ICQRSHandler<IncompletedJobsQuery, IncompletedJobsResponseData>
    implements IQueryHandler<IncompletedJobsQuery, IncompletedJobsResponseData>
{
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: IncompletedJobsQuery,
    ): Promise<IncompletedJobsResponseData> {
        const {
            user,
        } = query.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const jobs = await this.entityManager.find(
            JobEntity,
            {
                where: {
                    status: In(
                        [
                            JobStatus.Processing,
                            JobStatus.Queued
                        ]
                    ),
                    user: {
                        id: user.id,
                    },
                    actionType: In(
                        [
                            ActionType.ProcessGitSubmission,
                            ActionType.ProcessGoogleDocsSubmission,
                        ],
                    ),
                },
                select: {
                    id: true,
                    status: true,
                    queueAt: true,
                },
                order: {
                    queueAt: "DESC",
                },
            },
        )

        const items: Array<IncompletedJobItem> = jobs.map(
            (job) => ({
                jobId: job.id,
                status: job.status,
            }),
        )

        return {
            items,
        }
    }
}
