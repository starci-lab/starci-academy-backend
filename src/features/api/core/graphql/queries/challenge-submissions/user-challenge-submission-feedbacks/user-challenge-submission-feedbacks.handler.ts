import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionFeedbackEntity,
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
    UserChallengeSubmissionFeedbacksQuery,
} from "./user-challenge-submission-feedbacks.query"
import {
    UserChallengeSubmissionFeedbacksResponseData,
    UserChallengeSubmissionFeedbacksSortBy,
} from "./graphql-types"

@QueryHandler(UserChallengeSubmissionFeedbacksQuery)
@Injectable()
/**
 * Paginated scorer feedback for one submission attempt. Does not verify the
 * caller owns the attempt -- the resolver's auth guard is the gate; passing a
 * foreign attempt id still returns that attempt's feedback.
 */
export class UserChallengeSubmissionFeedbacksHandler
    extends ICQRSHandler<UserChallengeSubmissionFeedbacksQuery, UserChallengeSubmissionFeedbacksResponseData>
    implements IQueryHandler<UserChallengeSubmissionFeedbacksQuery, UserChallengeSubmissionFeedbacksResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: UserChallengeSubmissionFeedbacksQuery,
    ): Promise<UserChallengeSubmissionFeedbacksResponseData> {
        const {
            request: {
                submissionAttemptId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
        } = query.params

        const order: FindOptionsOrder<UserChallengeSubmissionFeedbackEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as UserChallengeSubmissionFeedbacksSortBy] = sort.order
        }

        const [
            data,
            count,
        ] = await this.entityManager.findAndCount(
            UserChallengeSubmissionFeedbackEntity,
            {
                where: {
                    attempt: {
                        id: submissionAttemptId,
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
