import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ConsultantRequest,
} from "./graphql-types"

/** Single Headhunter lookup query. */
export class ConsultantQuery {
    constructor(
        readonly params: ExecuteParams<ConsultantRequest>,
    ) {}
}
