import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    LivestreamSessionsRequest,
} from "./graphql-types"

export class LivestreamSessionsQuery {
    constructor(
        readonly params: ExecuteParams<LivestreamSessionsRequest>,
    ) {}
}
