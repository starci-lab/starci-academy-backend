import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    EmptyObject,
} from "@modules/common"

/**
 * QueryBus payload for `myCvBlocks`: locale + user (empty request) into
 * {@link MyCvBlocksHandler}. Constructed by the query service — not injected.
 */
export class MyCvBlocksQuery {
    constructor(
        readonly params: ExecuteParams<EmptyObject>,
    ) {}
}
