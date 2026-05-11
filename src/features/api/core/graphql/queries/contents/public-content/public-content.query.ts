import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    PublicContentRequest,
} from "./graphql-types"

export class PublicContentQuery {
    constructor(
        readonly params: ExecuteParams<PublicContentRequest>,
    ) {}
}
