import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    UpdateMyAiSettingsCommand,
} from "./update-my-ai-settings.command"
import {
    UpdateMyAiSettingsRequest,
} from "./graphql-types"

@Injectable()
export class UpdateMyAiSettingsService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<UpdateMyAiSettingsRequest>,
    ): Promise<void> {
        return this.commandBus.execute(
            new UpdateMyAiSettingsCommand(params),
        )
    }
}
