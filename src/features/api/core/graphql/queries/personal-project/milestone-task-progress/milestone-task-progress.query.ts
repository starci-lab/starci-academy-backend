import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MilestoneTaskProgressRequest,
} from "./graphql-types"

export class MilestoneTaskProgressQuery {
    constructor(
        readonly params: ExecuteParams<MilestoneTaskProgressRequest>,
    ) {}
}
