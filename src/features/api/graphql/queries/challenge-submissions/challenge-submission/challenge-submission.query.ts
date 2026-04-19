import {
    ExecuteParams,
} from "@features/api/types"
import {
    ChallengeSubmissionRequest,
} from "./graphql-types"

export class ChallengeSubmissionQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeSubmissionRequest>,
    ) {}
}
