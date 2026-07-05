import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ExtractDocumentTextRequest,
} from "./graphql-types"

export class ExtractDocumentTextCommand {
    constructor(
        readonly params: ExecuteParams<ExtractDocumentTextRequest>,
    ) { }
}
