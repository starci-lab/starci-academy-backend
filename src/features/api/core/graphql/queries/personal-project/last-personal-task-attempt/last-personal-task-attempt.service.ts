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
    LastPersonalTaskAttemptQuery,
} from "./last-personal-task-attempt.query"
import {
    LastPersonalTaskAttemptRequest,
    LastPersonalTaskAttemptResponseData,
} from "./graphql-types"

@Injectable()
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
