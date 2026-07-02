import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MyCvGenerationsRequest,
} from "./graphql-types"

export class MyCvGenerationsQuery {
    constructor(
        readonly params: ExecuteParams<MyCvGenerationsRequest>,
    ) { }
}
