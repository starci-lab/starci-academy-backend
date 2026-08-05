import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChallengesRequest,
} from "./graphql-types"

/**
 * QueryBus payload for `challenges`: request + locale into {@link ChallengesHandler}.
 * Constructed by the query service -- not injected.
 */
export class ChallengesQuery {
    constructor(
        readonly params: ExecuteParams<ChallengesRequest>,
    ) {}
}
