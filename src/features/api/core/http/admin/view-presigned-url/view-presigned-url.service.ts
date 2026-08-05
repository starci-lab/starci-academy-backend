import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ViewPresignedUrlCommand,
    type ViewPresignedUrlCommandParams,
    type ViewPresignedUrlItem,
} from "./view-presigned-url.command"

@Injectable()
/**
 * Dispatches view-presign through the command bus so the controller stays a thin HTTP
 * leaf.
 */
export class ViewPresignedUrlService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ViewPresignedUrlCommandParams,
    ): Promise<Array<ViewPresignedUrlItem>> {
        return this.commandBus.execute(
            new ViewPresignedUrlCommand(params),
        )
    }
}
