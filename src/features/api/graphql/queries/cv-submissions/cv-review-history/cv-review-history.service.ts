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
    CvReviewHistoryQuery,
} from "./cv-review-history.query"
import {
    CvReviewHistoryRequest,
    CvReviewHistoryResponseData,
} from "./graphql-types"

@Injectable()
export class CvReviewHistoryService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CvReviewHistoryRequest>,
    ): Promise<CvReviewHistoryResponseData> {
        return this.queryBus.execute(
            new CvReviewHistoryQuery(params),
        )
    }
}
