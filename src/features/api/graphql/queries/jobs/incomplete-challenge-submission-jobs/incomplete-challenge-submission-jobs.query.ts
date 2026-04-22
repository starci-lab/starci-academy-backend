import {
    ExecuteParams,
} from "@features/api/types"

export class IncompleteChallengeSubmissionJobsQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
