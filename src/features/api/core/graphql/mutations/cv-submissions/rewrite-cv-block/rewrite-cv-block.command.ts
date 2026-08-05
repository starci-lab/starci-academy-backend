import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    RewriteCvBlockRequest,
} from "./graphql-types"

/** CQRS envelope for an in-memory single-block rewrite. */
export class RewriteCvBlockCommand {
    constructor(
        readonly params: ExecuteParams<RewriteCvBlockRequest>,
    ) { }
}
