import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ConsultantRequest,
} from "./graphql-types/request"

/** Single Headhunter lookup query. */
export class ConsultantQuery {
    constructor(
        readonly params: ExecuteParams<ConsultantRequest>,
    ) {}
}
