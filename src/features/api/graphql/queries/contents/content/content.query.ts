import {
    ExecuteParams,
} from "@features/api/types"
import {
    ContentRequest,
} from "./graphql-types"

export class ContentQuery {
    constructor(
        readonly params: ExecuteParams<ContentRequest>,
    ) {}
}
