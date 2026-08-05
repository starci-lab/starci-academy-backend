import {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    JobPostingRequestParams,
} from "./types/job-posting-request"

/** jobPosting single-lookup query, by `displayId`. */
export class JobPostingQuery {
    constructor(
        readonly params: ExecuteParams<JobPostingRequestParams>,
    ) {}
}
