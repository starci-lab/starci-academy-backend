import {
    ExecuteParams,
} from "../../../../types"

/**
 * Query for the Me query.
 */
export class MeQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
