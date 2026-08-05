import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChallengeRequest,
} from "./graphql-types"

/**
 * QueryBus payload for `challenge`: request + locale into {@link ChallengeHandler}.
 * Constructed by the query service -- not injected.
 */
export class ChallengeQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeRequest>,
    ) {}
}
