import type {
    ExecuteParams,
} from "../../../../types/execute"

/** Identity of the posting whose internal applications are requested. */
export interface JobApplicationsRequest {
    jobPostingId: string
}

/** CQRS query for applications visible to a posting owner. */
export class JobApplicationsQuery {
    constructor(
        readonly params: ExecuteParams<JobApplicationsRequest>,
    ) {}
}
