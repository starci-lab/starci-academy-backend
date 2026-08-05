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
    ChallengesQuery,
} from "./challenges.query"
import {
    ChallengesRequest,
} from "./graphql-types/request"
import {
    ChallengesResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Dispatches `challenges` through QueryBus so the resolver never constructs
 * the CQRS query itself.
 */
export class ChallengesService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ChallengesRequest>,
    ): Promise<ChallengesResponseData> {
        return this.queryBus.execute(
            new ChallengesQuery(params),
        )
    }
}
