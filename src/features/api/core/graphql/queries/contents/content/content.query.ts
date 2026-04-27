import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ContentRequest,
} from "./graphql-types"

export class ContentQuery {
    constructor(
        readonly params: ExecuteParams<ContentRequest>,
    ) {}
}
