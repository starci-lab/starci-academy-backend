import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UserPersonalTaskAttemptsQuery,
} from "./user-personal-task-attempts.query"
import {
    UserPersonalTaskAttemptsRequest,
} from "./graphql-types/request"
import {
    UserPersonalTaskAttemptsResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin QueryBus adapter for userPersonalTaskAttempts.
 */
export class UserPersonalTaskAttemptsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<UserPersonalTaskAttemptsRequest>,
    ): Promise<UserPersonalTaskAttemptsResponseData> {
        return this.queryBus.execute(
            new UserPersonalTaskAttemptsQuery(params),
        )
    }
}
