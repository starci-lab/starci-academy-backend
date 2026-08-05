import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ExtractDocumentTextRequest,
} from "./graphql-types/request"

/** CQRS envelope for extracting text without persisting the file contents. */
export class ExtractDocumentTextCommand {
    constructor(
        readonly params: ExecuteParams<ExtractDocumentTextRequest>,
    ) { }
}
