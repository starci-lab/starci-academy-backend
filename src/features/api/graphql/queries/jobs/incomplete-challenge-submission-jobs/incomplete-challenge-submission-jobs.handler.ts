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
    IncompleteChallengeSubmissionJobsQuery,
} from "./incomplete-challenge-submission-jobs.query"
import {
    IncompleteChallengeSubmissionJobItem,
    IncompleteChallengeSubmissionJobsResponseData,
} from "./graphql-types"
import {
    UserNotFoundException
} from "@modules/exceptions"

@QueryHandler(IncompleteChallengeSubmissionJobsQuery)
@Injectable()
export class IncompleteChallengeSubmissionJobsHandler
    extends ICQRSHandler<IncompleteChallengeSubmissionJobsQuery, IncompleteChallengeSubmissionJobsResponseData>
    implements IQueryHandler<IncompleteChallengeSubmissionJobsQuery, IncompleteChallengeSubmissionJobsResponseData>
{
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: IncompleteChallengeSubmissionJobsQuery,
    ): Promise<IncompleteChallengeSubmissionJobsResponseData> {
        const {
            user,
        } = query.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const incompleteJobs = await this.entityManager.find(
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

        const items: Array<IncompleteChallengeSubmissionJobItem> = incompleteJobs.map(
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
