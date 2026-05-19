import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ConsultantsRequest,
} from "./graphql-types"

/**
 * Headhunters query.
 */
export class ConsultantsQuery {
    constructor(
        readonly params: ExecuteParams<ConsultantsRequest>,
    ) {}
}
