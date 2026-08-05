import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    CheckEmailExistsRequest,
} from "./graphql-types/request"

/** CQRS query for checking whether an email exists using bloom filter. */
export class CheckEmailExistsQuery {
    constructor(
        public readonly params: ExecuteParams<CheckEmailExistsRequest>,
    ) {}
}

