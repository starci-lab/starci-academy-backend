import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ExtractDocumentTextRequest,
} from "./graphql-types"

/** CQRS envelope for extracting text without persisting the file contents. */
export class ExtractDocumentTextCommand {
    constructor(
        readonly params: ExecuteParams<ExtractDocumentTextRequest>,
    ) { }
}
