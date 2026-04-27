import {
    ExecuteParams,
} from "@features/api/core/types"

export class IncompleteChallengeSubmissionJobsQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
