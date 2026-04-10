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
    type EntityManager,
    type FindOptionsOrder,
} from "typeorm"
import {
    ExecuteParams,
} from "../../../../types"
import { 
    SubmissionFeedbacksRequest, 
    SubmissionFeedbacksResponseData, 
    SubmissionFeedbacksSortBy 
} from "./graphql-types"


/**
 * Service for querying submission feedbacks.
 */
@Injectable()
export class SubmissionFeedbacksService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Entry: returns a list of submission feedbacks with pagination.
     *
     * @param params - Query parameters including filters, pagination, and locale.
     * @returns Paginated results and count.
     */
    async execute(
        {
            request: {
                submissionAttemptId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
        }: ExecuteParams<SubmissionFeedbacksRequest>,
    ): Promise<SubmissionFeedbacksResponseData> {
        const order: FindOptionsOrder<SubmissionFeedbackEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as SubmissionFeedbacksSortBy] = sort.order
        }

        const [
            data,
            count
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
