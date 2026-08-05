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
    LastPersonalTaskAttemptQuery,
} from "./last-personal-task-attempt.query"
import {
    LastPersonalTaskAttemptRequest,
} from "./graphql-types/request"
import {
    LastPersonalTaskAttemptResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin QueryBus adapter for lastPersonalTaskAttempt (includes keycloakToken in params).
 */
export class LastPersonalTaskAttemptService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<LastPersonalTaskAttemptRequest>,
    ): Promise<LastPersonalTaskAttemptResponseData> {
        return this.queryBus.execute(
            new LastPersonalTaskAttemptQuery(params),
        )
    }
}
