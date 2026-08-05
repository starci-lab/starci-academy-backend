import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    FoundationsRequest,
} from "./graphql-types/request"

/**
 * Foundations query.
 */
export class FoundationsQuery {
    constructor(
        readonly params: ExecuteParams<FoundationsRequest>,
    ) {}
}
