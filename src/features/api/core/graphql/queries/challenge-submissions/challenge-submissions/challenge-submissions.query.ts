import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ChallengeSubmissionsRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `challengeSubmissions`: request + locale + user into
 * {@link ChallengeSubmissionsHandler}. Constructed by the query service -- not injected.
 */
export class ChallengeSubmissionsQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeSubmissionsRequest>,
    ) {}
}
