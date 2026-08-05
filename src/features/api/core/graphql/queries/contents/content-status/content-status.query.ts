import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ContentStatusRequest,
} from "./graphql-types/request"

/**
 * CQRS message carrying contentStatus ExecuteParams into ContentStatusHandler.
 */
export class ContentStatusQuery {
    constructor(
        readonly params: ExecuteParams<ContentStatusRequest>,
    ) {}
}
