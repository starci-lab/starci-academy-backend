import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserCvSubmissionAttemptsHistoryQuery,
} from "./user-cv-submission-attempts-history.query"
import {
    CvReviewHistoryRequest,
    CvReviewHistoryResponseData,
} from "./graphql-types"

@Injectable()
export class UserCvSubmissionAttemptsHistoryService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CvReviewHistoryRequest>,
    ): Promise<CvReviewHistoryResponseData> {
        return this.queryBus.execute(
            new UserCvSubmissionAttemptsHistoryQuery(params),
        )
    }
}
