import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    VerifySubmitCvPresignUrlCommand,
} from "./verify-submit-cv-presign-url.command"
import {
    VerifySubmitCvPresignUrlRequest,
    VerifySubmitCvPresignUrlResponseData,
} from "./graphql-types"
import {
    ExecuteParams 
} from "../../../../types"

@Injectable()
export class VerifySubmitCvPresignUrlService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<VerifySubmitCvPresignUrlRequest>,
    ): Promise<VerifySubmitCvPresignUrlResponseData> {
        return this.commandBus.execute(
            new VerifySubmitCvPresignUrlCommand(params),
        )
    }
}
