import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ContentStatusRequest,
} from "./graphql-types"

/**
 * CQRS message carrying contentStatus ExecuteParams into ContentStatusHandler.
 */
export class ContentStatusQuery {
    constructor(
        readonly params: ExecuteParams<ContentStatusRequest>,
    ) {}
}
