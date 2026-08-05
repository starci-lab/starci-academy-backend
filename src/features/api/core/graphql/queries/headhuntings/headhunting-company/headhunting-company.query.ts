import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    HeadhuntingCompanyRequest,
} from "./graphql-types/request"

/** Single headhunting company lookup query. */
export class HeadhunterCompanyQuery {
    constructor(
        readonly params: ExecuteParams<HeadhuntingCompanyRequest>,
    ) {}
}
