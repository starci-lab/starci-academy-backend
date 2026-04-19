import {
    ICQRSHandler,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
    SubmissionFeedbackEntity,
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
    SubmissionFeedbacksQuery,
} from "./submission-feedbacks.query"
import {
    SubmissionFeedbacksResponseData,
    SubmissionFeedbacksSortBy,
} from "./graphql-types"

@QueryHandler(SubmissionFeedbacksQuery)
@Injectable()
export class SubmissionFeedbacksHandler
    extends ICQRSHandler<SubmissionFeedbacksQuery, SubmissionFeedbacksResponseData>
    implements IQueryHandler<SubmissionFeedbacksQuery, SubmissionFeedbacksResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: SubmissionFeedbacksQuery,
    ): Promise<SubmissionFeedbacksResponseData> {
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

        const order: FindOptionsOrder<SubmissionFeedbackEntity> = {}
        for (const sort of sorts) {
            order[sort.by as SubmissionFeedbacksSortBy] = sort.order
        }

        const [
            data,
            count,
        ] = await this.entityManager.findAndCount(
            SubmissionFeedbackEntity,
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
