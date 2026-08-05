import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ContentRequest,
} from "./graphql-types/request"

/**
 * CQRS message carrying content ExecuteParams into ContentHandler.
 */
export class ContentQuery {
    constructor(
        readonly params: ExecuteParams<ContentRequest>,
    ) {}
}
