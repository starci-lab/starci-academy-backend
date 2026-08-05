import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MilestonesRequest,
} from "./graphql-types"

/** CQRS message that lists every milestone in a course. */
export class MilestonesQuery {
    constructor(
        readonly params: ExecuteParams<MilestonesRequest>,
    ) {}
}
