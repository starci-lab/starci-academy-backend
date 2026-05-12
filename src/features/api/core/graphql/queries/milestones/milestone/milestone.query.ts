import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MilestoneRequest,
} from "./graphql-types"

export class MilestoneQuery {
    constructor(
        readonly params: ExecuteParams<MilestoneRequest>,
    ) {}
}
