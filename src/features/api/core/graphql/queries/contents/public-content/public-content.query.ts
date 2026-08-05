import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    PublicContentRequest,
} from "./graphql-types/request"

/**
 * CQRS message carrying publicContent ExecuteParams into PublicContentHandler.
 */
export class PublicContentQuery {
    constructor(
        readonly params: ExecuteParams<PublicContentRequest>,
    ) {}
}
