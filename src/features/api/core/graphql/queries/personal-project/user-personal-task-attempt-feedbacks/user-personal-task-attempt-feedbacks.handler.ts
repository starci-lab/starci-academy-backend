import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserMilestoneTaskAttemptFeedbackEntity,
} from "@modules/databases/postgresql/primary/entities/user-milestone-task-attempt-feedback.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
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
    UserPersonalTaskAttemptFeedbacksSortBy,
} from "./graphql-types/request"
import {
    UserPersonalTaskAttemptFeedbacksResponseData,
} from "./graphql-types/response"

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
