import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    HeadhuntingCompanyRequest,
} from "./graphql-types"

/** Single headhunting company lookup query. */
export class HeadhunterCompanyQuery {
    constructor(
        readonly params: ExecuteParams<HeadhuntingCompanyRequest>,
    ) {}
}
