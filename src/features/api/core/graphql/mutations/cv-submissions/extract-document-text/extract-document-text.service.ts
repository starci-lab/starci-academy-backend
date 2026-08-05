import {
    ExecuteParams,
} from "@features/api/core/types"
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
    ExtractDocumentTextData,
} from "./graphql-types"

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
