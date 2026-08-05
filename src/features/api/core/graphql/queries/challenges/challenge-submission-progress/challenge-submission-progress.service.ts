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
    ChallengeSubmissionProgressQuery,
} from "./challenge-submission-progress.query"
import {
    ChallengeSubmissionProgressRequest,
} from "./graphql-types/request"
import {
    ChallengeSubmissionProgressResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin wrapper dispatching {@link ChallengeSubmissionProgressQuery} onto the
 * CQRS query bus, so the resolver stays free of CQRS wiring.
 */
export class ChallengeSubmissionProgressService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * @param params - The request DTO plus the authenticated user.
     */
    async execute(
        params: ExecuteParams<ChallengeSubmissionProgressRequest>,
    ): Promise<ChallengeSubmissionProgressResponseData> {
        return this.queryBus.execute(
            new ChallengeSubmissionProgressQuery(params),
        )
    }
}
