import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    GenerateAvatarPresignUrlCommand,
    GenerateAvatarPresignUrlCommandParams,
} from "./generate-avatar-presign-url.command"
import {
    GenerateAvatarPresignUrlResponseData,
} from "./graphql-types"

/**
 * Thin mutation service dispatching to the command bus.
 */
@Injectable()
export class GenerateAvatarPresignUrlService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatch the generate-presign-url command.
     *
     * @param params - {@link GenerateAvatarPresignUrlCommandParams}
     * @returns the presigned URL + object key.
     */
    async execute(
        params: GenerateAvatarPresignUrlCommandParams,
    ): Promise<GenerateAvatarPresignUrlResponseData> {
        return this.commandBus.execute(
            new GenerateAvatarPresignUrlCommand(params),
        )
    }
}
