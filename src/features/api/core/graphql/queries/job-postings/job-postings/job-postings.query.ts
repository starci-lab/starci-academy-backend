import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    JobPostingsRequest,
} from "./graphql-types"

/** jobPostings list query. */
export class JobPostingsQuery {
    constructor(
        readonly params: ExecuteParams<JobPostingsRequest>,
    ) {}
}
