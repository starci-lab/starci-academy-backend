import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChallengeSubmissionsRequest,
} from "./graphql-types"

/**
 * QueryBus payload for `challengeSubmissions`: request + locale + user into
 * {@link ChallengeSubmissionsHandler}. Constructed by the query service — not injected.
 */
export class ChallengeSubmissionsQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeSubmissionsRequest>,
    ) {}
}
