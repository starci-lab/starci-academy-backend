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
