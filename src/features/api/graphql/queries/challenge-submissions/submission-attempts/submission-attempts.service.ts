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
    SubmissionAttemptsQuery,
} from "./submission-attempts.query"
import {
    SubmissionAttemptsRequest,
    SubmissionAttemptsResponseData,
} from "./graphql-types"

@Injectable()
export class SubmissionAttemptsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<SubmissionAttemptsRequest>,
    ): Promise<SubmissionAttemptsResponseData> {
        return this.queryBus.execute(
            new SubmissionAttemptsQuery(params),
        )
    }
}
