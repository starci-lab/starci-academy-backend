import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    PresignedUrlCommand,
    type PresignedUrlCommandParams,
    type PresignedUrlItem,
} from "./presigned-url.command"

@Injectable()
/**
 * Dispatches presign through the command bus so the HTTP controller stays free of S3/MinIO
 * clients.
 */
export class PresignedUrlService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: PresignedUrlCommandParams,
    ): Promise<Array<PresignedUrlItem>> {
        return this.commandBus.execute(
            new PresignedUrlCommand(params),
        )
    }
}
