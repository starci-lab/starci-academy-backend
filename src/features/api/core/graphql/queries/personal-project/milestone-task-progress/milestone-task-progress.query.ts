import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    MilestoneTaskProgressRequest,
} from "./graphql-types/request"

/**
 * CQRS query carrying the `milestoneTaskProgress` request params (request
 * DTO + authenticated user) to {@link MilestoneTaskProgressHandler}.
 */
export class MilestoneTaskProgressQuery {
    constructor(
        readonly params: ExecuteParams<MilestoneTaskProgressRequest>,
    ) {}
}
