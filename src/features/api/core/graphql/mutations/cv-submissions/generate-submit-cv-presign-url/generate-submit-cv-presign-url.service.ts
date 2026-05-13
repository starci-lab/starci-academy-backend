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
} from "./graphql-types"

@Injectable()
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
