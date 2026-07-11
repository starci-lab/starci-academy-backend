import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CreatePlaygroundSessionRequest,
} from "./graphql-types"

export class CreatePlaygroundSessionCommand {
    constructor(
        readonly params: ExecuteParams<CreatePlaygroundSessionRequest>,
    ) {}
}
