import {
    ExecuteParams,
} from "@features/api/core/types"

/**
 * headhuntingCompanies list query.
 */
export class HeadhunterCompaniesQuery {
    constructor(
        readonly params: ExecuteParams<void>,
    ) {}
}
