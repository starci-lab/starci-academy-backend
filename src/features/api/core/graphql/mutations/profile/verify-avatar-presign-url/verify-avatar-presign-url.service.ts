import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    VerifyAvatarPresignUrlCommand,
    VerifyAvatarPresignUrlCommandParams,
} from "./verify-avatar-presign-url.command"
import {
    VerifyAvatarPresignUrlResponseData,
} from "./graphql-types"

@Injectable()
/**
 * Thin mutation service dispatching to the command bus.
 */
export class VerifyAvatarPresignUrlService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatch the verify-presign-url command.
     *
     * @param params - {@link VerifyAvatarPresignUrlCommandParams}
     * @returns whether the object existed + the persisted public URL.
     */
    async execute(
        params: VerifyAvatarPresignUrlCommandParams,
    ): Promise<VerifyAvatarPresignUrlResponseData> {
        return this.commandBus.execute(
            new VerifyAvatarPresignUrlCommand(params),
        )
    }
}
