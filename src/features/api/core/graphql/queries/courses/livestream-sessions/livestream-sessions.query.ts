import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    LivestreamSessionsRequest,
} from "./graphql-types/request"

/** CQRS message that lists paginated livestream sessions for a course. */
export class LivestreamSessionsQuery {
    constructor(
        readonly params: ExecuteParams<LivestreamSessionsRequest>,
    ) {}
}
