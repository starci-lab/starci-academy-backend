import {
    ExecuteParams,
} from "@features/api/core/types"

export class IncompletedJobsQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
