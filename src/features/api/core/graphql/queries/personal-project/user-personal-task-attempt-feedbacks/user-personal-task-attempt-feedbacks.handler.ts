import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserMilestoneTaskAttemptFeedbackEntity,
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
    UserPersonalTaskAttemptFeedbacksQuery,
} from "./user-personal-task-attempt-feedbacks.query"
import {
    UserPersonalTaskAttemptFeedbacksResponseData,
    UserPersonalTaskAttemptFeedbacksSortBy,
} from "./graphql-types"

@QueryHandler(UserPersonalTaskAttemptFeedbacksQuery)
@Injectable()
/**
 * Pages feedback rows for a given attemptId (no ownership check here -- auth is
 * at the resolver guard; attempt id is the sole filter).
 */
export class UserPersonalTaskAttemptFeedbacksHandler
    extends ICQRSHandler<UserPersonalTaskAttemptFeedbacksQuery, UserPersonalTaskAttemptFeedbacksResponseData>
    implements IQueryHandler<UserPersonalTaskAttemptFeedbacksQuery, UserPersonalTaskAttemptFeedbacksResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: UserPersonalTaskAttemptFeedbacksQuery,
    ): Promise<UserPersonalTaskAttemptFeedbacksResponseData> {
        const {
            request: {
                attemptId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
        } = query.params

        const order: FindOptionsOrder<UserMilestoneTaskAttemptFeedbackEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as UserPersonalTaskAttemptFeedbacksSortBy] = sort.order
        }

        const [
            data,
            count,
        ] = await this.entityManager.findAndCount(
            UserMilestoneTaskAttemptFeedbackEntity,
            {
                where: {
                    attempt: {
                        id: attemptId,
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
