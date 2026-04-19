import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    SubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    type EntityManager,
    type FindOptionsOrder,
} from "typeorm"
import {
    SubmissionAttemptsQuery,
} from "./submission-attempts.query"
import {
    SubmissionAttemptsResponseData,
    SubmissionAttemptsSortBy,
} from "./graphql-types"

@QueryHandler(SubmissionAttemptsQuery)
@Injectable()
export class SubmissionAttemptsHandler
    extends ICQRSHandler<SubmissionAttemptsQuery, SubmissionAttemptsResponseData>
    implements IQueryHandler<SubmissionAttemptsQuery, SubmissionAttemptsResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: SubmissionAttemptsQuery,
    ): Promise<SubmissionAttemptsResponseData> {
        const {
            request: {
                challengeSubmissionId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
        } = query.params

        const order: FindOptionsOrder<SubmissionAttemptEntity> = {}
        for (const sort of sorts) {
            order[sort.by as SubmissionAttemptsSortBy] = sort.order
        }

        const userChallengeSubmission = await this.entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    submission: {
                        id: challengeSubmissionId,
                    },
                },
            },
        )
        if (!userChallengeSubmission) {
            return {
                data: [],
                count: 0,
            }
        }

        const [
            data,
            count,
        ] = await this.entityManager.findAndCount(
            SubmissionAttemptEntity,
            {
                where: {
                    userChallengeSubmission: {
                        id: userChallengeSubmission.id,
                    },
                },
                order,
                skip: pageNumber * limit,
                take: limit,
            },
        )
        return {
            data,
            count,
        }
    }
}
