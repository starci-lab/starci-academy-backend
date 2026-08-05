import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"

/**
 * QueryBus payload for `myCvBlocks`: locale + user (empty request) into
 * {@link MyCvBlocksHandler}. Constructed by the query service -- not injected.
 */
export class MyCvBlocksQuery {
    constructor(
        readonly params: ExecuteParams<EmptyObject>,
    ) {}
}
