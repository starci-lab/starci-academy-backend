import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    LivestreamSessionsRequest,
} from "./graphql-types"

/** CQRS message that lists paginated livestream sessions for a course. */
export class LivestreamSessionsQuery {
    constructor(
        readonly params: ExecuteParams<LivestreamSessionsRequest>,
    ) {}
}
