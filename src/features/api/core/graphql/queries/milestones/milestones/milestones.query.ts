import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    MilestonesRequest,
} from "./graphql-types/request"

/** CQRS message that lists every milestone in a course. */
export class MilestonesQuery {
    constructor(
        readonly params: ExecuteParams<MilestonesRequest>,
    ) {}
}
