import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ProcessVideoCommand,
    type ProcessVideoCommandParams,
    type ProcessVideoResult,
} from "./process-video.command"

@Injectable()
export class ProcessVideoService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ProcessVideoCommandParams,
    ): Promise<ProcessVideoResult> {
        return this.commandBus.execute(
            new ProcessVideoCommand(params),
        )
    }
}
