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
    ChallengesQuery,
} from "./challenges.query"
import {
    ChallengesRequest,
    ChallengesResponseData,
} from "./graphql-types"

@Injectable()
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
