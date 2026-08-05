import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ChallengeRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `challenge`: request + locale into {@link ChallengeHandler}.
 * Constructed by the query service -- not injected.
 */
export class ChallengeQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeRequest>,
    ) {}
}
