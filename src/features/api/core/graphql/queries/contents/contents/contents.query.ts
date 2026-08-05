import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ContentsRequest,
} from "./graphql-types"

/**
 * CQRS message carrying contents ExecuteParams into ContentsHandler.
 */
export class ContentsQuery {
    constructor(
        readonly params: ExecuteParams<ContentsRequest>,
    ) {}
}
