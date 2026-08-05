import {
    ExecuteParams,
} from "../../../../types/execute"

/** CQRS query for listing the caller's jobs that are still queued or processing. */
export class IncompletedJobsQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
