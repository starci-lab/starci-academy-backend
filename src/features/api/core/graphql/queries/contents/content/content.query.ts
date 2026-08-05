import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ContentRequest,
} from "./graphql-types"

/**
 * CQRS message carrying content ExecuteParams into ContentHandler.
 */
export class ContentQuery {
    constructor(
        readonly params: ExecuteParams<ContentRequest>,
    ) {}
}
