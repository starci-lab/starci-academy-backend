import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    RewriteCvBlockRequest,
} from "./graphql-types/request"

/** CQRS envelope for an in-memory single-block rewrite. */
export class RewriteCvBlockCommand {
    constructor(
        readonly params: ExecuteParams<RewriteCvBlockRequest>,
    ) { }
}
