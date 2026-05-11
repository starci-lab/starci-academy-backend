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
    UserPersonalTaskAttemptsQuery,
} from "./user-personal-task-attempts.query"
import {
    UserPersonalTaskAttemptsRequest,
    UserPersonalTaskAttemptsResponseData,
} from "./graphql-types"

@Injectable()
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
