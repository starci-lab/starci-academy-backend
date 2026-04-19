import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ChallengeEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/types"
import {
    ChallengeRequest,
} from "./graphql-types"
import {
    ChallengeQuery,
} from "./challenge.query"

@Injectable()
export class ChallengeQueryService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ChallengeRequest>,
    ): Promise<ChallengeEntity> {
        return this.queryBus.execute(
            new ChallengeQuery(params),
        )
    }
}
