import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExtractDocumentTextCommand,
} from "./extract-document-text.command"
import {
    ExtractDocumentTextRequest,
} from "./graphql-types/request"
import {
    ExtractDocumentTextData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver does not import S3 or parser code. */
export class ExtractDocumentTextService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<ExtractDocumentTextRequest>,
    ): Promise<ExtractDocumentTextData> {
        return this.commandBus.execute(
            new ExtractDocumentTextCommand(params),
        )
    }
}
