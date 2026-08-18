import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    GenerateAvatarPresignUrlCommand,
    GenerateAvatarPresignUrlParams,
} from "./generate-avatar-presign-url.command"
import {
    GenerateAvatarPresignUrlResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin mutation service dispatching to the command bus.
 */
export class GenerateAvatarPresignUrlService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatch the generate-presign-url command.
     *
     * @param params - {@link GenerateAvatarPresignUrlParams}
     * @returns the presigned URL + object key.
     */
    async execute(
        params: GenerateAvatarPresignUrlParams,
    ): Promise<GenerateAvatarPresignUrlResponseData> {
        return this.commandBus.execute(
            new GenerateAvatarPresignUrlCommand(params),
        )
    }
}
