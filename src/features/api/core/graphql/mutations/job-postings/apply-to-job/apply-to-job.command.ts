import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    ApplyToJobRequest,
} from "./graphql-types/request"

/** CQRS envelope for submitting one internal job application. */
export class ApplyToJobCommand {
    constructor(
        readonly params: ExecuteParams<ApplyToJobRequest>,
    ) {}
}
