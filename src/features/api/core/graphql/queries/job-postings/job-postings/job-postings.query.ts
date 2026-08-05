import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    JobPostingsRequest,
} from "./graphql-types/request"

/** jobPostings list query. */
export class JobPostingsQuery {
    constructor(
        readonly params: ExecuteParams<JobPostingsRequest>,
    ) {}
}
