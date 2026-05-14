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
    UserCvSubmissionAttemptsQuery,
} from "./user-cv-submission-attempts.query"
import {
    UserCvSubmissionAttemptsRequest,
    UserCvSubmissionAttemptsPayload,
} from "./graphql-types"

@Injectable()
export class UserCvSubmissionAttemptsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<UserCvSubmissionAttemptsRequest>,
    ): Promise<UserCvSubmissionAttemptsPayload> {
        return this.queryBus.execute(
            new UserCvSubmissionAttemptsQuery(params),
        )
    }
}
