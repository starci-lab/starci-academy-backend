import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ContentStatusRequest,
} from "./graphql-types"

export class ContentStatusQuery {
    constructor(
        readonly params: ExecuteParams<ContentStatusRequest>,
    ) {}
}
