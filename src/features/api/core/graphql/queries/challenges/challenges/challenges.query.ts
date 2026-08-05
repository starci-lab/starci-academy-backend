import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ChallengesRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `challenges`: request + locale into {@link ChallengesHandler}.
 * Constructed by the query service -- not injected.
 */
export class ChallengesQuery {
    constructor(
        readonly params: ExecuteParams<ChallengesRequest>,
    ) {}
}
