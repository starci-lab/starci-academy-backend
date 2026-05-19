import {
    ExecuteParams,
} from "@features/api/core/types"

/**
 * Foundation categories list query.
 */
export class FoundationCategoriesQuery {
    constructor(
        readonly params: ExecuteParams<void>,
    ) {}
}
