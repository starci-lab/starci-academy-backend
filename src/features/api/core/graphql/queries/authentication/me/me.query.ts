import {
    ExecuteParams,
} from "../../../../types/execute"

/**
 * Query for the Me query.
 */
export class MeQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
