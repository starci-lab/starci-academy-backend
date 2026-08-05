import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MyCvGenerationsRequest,
} from "./graphql-types"

/**
 * QueryBus payload for `myCvGenerations`: request + locale + user into
 * {@link MyCvGenerationsHandler}. Constructed by the query service — not injected.
 */
export class MyCvGenerationsQuery {
    constructor(
        readonly params: ExecuteParams<MyCvGenerationsRequest>,
    ) { }
}
