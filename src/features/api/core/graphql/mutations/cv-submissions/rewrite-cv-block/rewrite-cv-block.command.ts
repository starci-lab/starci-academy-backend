import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    RewriteCvBlockRequest,
} from "./graphql-types"

export class RewriteCvBlockCommand {
    constructor(
        readonly params: ExecuteParams<RewriteCvBlockRequest>,
    ) { }
}
