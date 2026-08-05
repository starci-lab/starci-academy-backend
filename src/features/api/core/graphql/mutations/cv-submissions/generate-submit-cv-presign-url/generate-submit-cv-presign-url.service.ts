import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    GenerateSubmitCvPresignUrlCommand,
    GenerateSubmitCvPresignUrlCommandParams,
} from "./generate-submit-cv-presign-url.command"
import {
    GenerateSubmitCvPresignUrlResponseData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver does not import S3 signing. */
export class GenerateSubmitCvPresignUrlService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: GenerateSubmitCvPresignUrlCommandParams,
    ): Promise<GenerateSubmitCvPresignUrlResponseData> {
        return this.commandBus.execute(
            new GenerateSubmitCvPresignUrlCommand(params),
        )
    }
}
