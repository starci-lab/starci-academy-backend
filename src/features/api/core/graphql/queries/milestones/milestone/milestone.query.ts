import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MilestoneRequest,
} from "./graphql-types"

/** CQRS message that loads one milestone by id. */
export class MilestoneQuery {
    constructor(
        readonly params: ExecuteParams<MilestoneRequest>,
    ) {}
}
