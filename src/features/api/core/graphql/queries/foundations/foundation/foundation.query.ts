import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    FoundationRequest,
} from "./graphql-types"

/** Single foundation lookup query. */
export class FoundationQuery {
    constructor(
        readonly params: ExecuteParams<FoundationRequest>,
    ) {}
}
