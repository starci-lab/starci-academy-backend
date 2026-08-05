import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ChallengeSubmissionEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChallengeSubmissionQuery,
} from "./challenge-submission.query"
import {
    ChallengeSubmissionRequest,
} from "./graphql-types"

@Injectable()
/**
 * Dispatches `challengeSubmission` through QueryBus so the resolver never
 * constructs the CQRS query itself.
 */
export class ChallengeSubmissionQueryService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ChallengeSubmissionRequest>,
    ): Promise<ChallengeSubmissionEntity> {
        return this.queryBus.execute(
            new ChallengeSubmissionQuery(params),
        )
    }
}
