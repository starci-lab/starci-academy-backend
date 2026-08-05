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
    ChallengeSubmissionsQuery,
} from "./challenge-submissions.query"
import {
    ChallengeSubmissionsRequest,
    ChallengeSubmissionsResponseData,
} from "./graphql-types"

@Injectable()
/**
 * Dispatches `challengeSubmissions` through QueryBus so the resolver never
 * constructs the CQRS query itself.
 */
export class ChallengeSubmissionsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ChallengeSubmissionsRequest>,
    ): Promise<ChallengeSubmissionsResponseData> {
        return this.queryBus.execute(
            new ChallengeSubmissionsQuery(params),
        )
    }
}
