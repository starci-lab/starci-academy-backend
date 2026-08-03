import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MilestoneTaskProgressRequest,
} from "./graphql-types"

/**
 * CQRS query carrying the `milestoneTaskProgress` request params (request
 * DTO + authenticated user) to {@link MilestoneTaskProgressHandler}.
 */
export class MilestoneTaskProgressQuery {
    constructor(
        readonly params: ExecuteParams<MilestoneTaskProgressRequest>,
    ) {}
}
