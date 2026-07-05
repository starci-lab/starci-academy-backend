import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    EmptyObject,
} from "@modules/common"

export class MyCvBlocksQuery {
    constructor(
        readonly params: ExecuteParams<EmptyObject>,
    ) {}
}
