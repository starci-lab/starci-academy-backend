import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    FoundationsRequest,
} from "./graphql-types"

/**
 * Foundations query.
 */
export class FoundationsQuery {
    constructor(
        readonly params: ExecuteParams<FoundationsRequest>,
    ) {}
}
