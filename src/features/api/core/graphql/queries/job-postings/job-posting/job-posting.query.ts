import {
    ExecuteParams,
} from "@features/api/core/types"
import type {
    JobPostingRequestParams,
} from "./types"

/** jobPosting single-lookup query, by `displayId`. */
export class JobPostingQuery {
    constructor(
        readonly params: ExecuteParams<JobPostingRequestParams>,
    ) {}
}
