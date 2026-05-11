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
    ChallengeSubmissionProgressQuery,
} from "./challenge-submission-progress.query"
import {
    ChallengeSubmissionProgressRequest,
    ChallengeSubmissionProgressResponseData,
} from "./graphql-types"

@Injectable()
export class ChallengeSubmissionProgressService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ChallengeSubmissionProgressRequest>,
    ): Promise<ChallengeSubmissionProgressResponseData> {
        return this.queryBus.execute(
            new ChallengeSubmissionProgressQuery(params),
        )
    }
}
