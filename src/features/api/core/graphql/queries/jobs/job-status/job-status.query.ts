import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    JobStatusRequest,
} from "./graphql-types/request"

/** CQRS query carrying authenticated viewer context and one job selector. */
export class JobStatusQuery {
    constructor(
        readonly params: ExecuteParams<JobStatusRequest>,
    ) {}
}
