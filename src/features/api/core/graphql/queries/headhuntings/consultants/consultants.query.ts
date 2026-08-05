import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ConsultantsRequest,
} from "./graphql-types/request"

/**
 * Headhunters query.
 */
export class ConsultantsQuery {
    constructor(
        readonly params: ExecuteParams<ConsultantsRequest>,
    ) {}
}
