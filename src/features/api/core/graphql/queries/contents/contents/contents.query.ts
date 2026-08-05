import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ContentsRequest,
} from "./graphql-types/request"

/**
 * CQRS message carrying contents ExecuteParams into ContentsHandler.
 */
export class ContentsQuery {
    constructor(
        readonly params: ExecuteParams<ContentsRequest>,
    ) {}
}
