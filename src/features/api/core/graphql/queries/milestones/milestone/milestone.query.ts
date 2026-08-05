import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    MilestoneRequest,
} from "./graphql-types/request"

/** CQRS message that loads one milestone by id. */
export class MilestoneQuery {
    constructor(
        readonly params: ExecuteParams<MilestoneRequest>,
    ) {}
}
