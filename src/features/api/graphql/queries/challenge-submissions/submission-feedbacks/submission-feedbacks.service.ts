import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/types"
import {
    SubmissionFeedbacksQuery,
} from "./submission-feedbacks.query"
import {
    SubmissionFeedbacksRequest,
    SubmissionFeedbacksResponseData,
} from "./graphql-types"

@Injectable()
export class SubmissionFeedbacksService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<SubmissionFeedbacksRequest>,
    ): Promise<SubmissionFeedbacksResponseData> {
        return this.queryBus.execute(
            new SubmissionFeedbacksQuery(params),
        )
    }
}
