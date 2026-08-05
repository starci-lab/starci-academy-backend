import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    PublicContentRequest,
} from "./graphql-types"

/**
 * CQRS message carrying publicContent ExecuteParams into PublicContentHandler.
 */
export class PublicContentQuery {
    constructor(
        readonly params: ExecuteParams<PublicContentRequest>,
    ) {}
}
