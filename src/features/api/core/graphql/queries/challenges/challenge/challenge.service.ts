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
} from "@features/api/core/types"
import {
    ChallengeRequest,
} from "./graphql-types"
import {
    ChallengeQuery,
} from "./challenge.query"

@Injectable()
/**
 * Dispatches `challenge` through QueryBus so the resolver never constructs
 * the CQRS query itself.
 */
export class ChallengeQueryService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Execute the challenge query.
     * @param params - Parameters for the challenge query.
     * @returns Promise of ChallengeEntity.
     */
    async execute(
        params: ExecuteParams<ChallengeRequest>,
    ): Promise<ChallengeEntity> {
        return this.queryBus.execute(
            new ChallengeQuery(params),
        )
    }
}
