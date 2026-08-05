import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    MyCvGenerationsRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `myCvGenerations`: request + locale + user into
 * {@link MyCvGenerationsHandler}. Constructed by the query service -- not injected.
 */
export class MyCvGenerationsQuery {
    constructor(
        readonly params: ExecuteParams<MyCvGenerationsRequest>,
    ) { }
}
