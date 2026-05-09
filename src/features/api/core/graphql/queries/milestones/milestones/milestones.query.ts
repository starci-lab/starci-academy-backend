import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MilestonesRequest,
} from "./graphql-types"

export class MilestonesSingleQuery {
    constructor(
        readonly params: ExecuteParams<MilestonesRequest>,
    ) {}
}
