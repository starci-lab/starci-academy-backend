import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    FoundationRequest,
} from "./graphql-types/request"

/** Single foundation lookup query. */
export class FoundationQuery {
    constructor(
        readonly params: ExecuteParams<FoundationRequest>,
    ) {}
}
