import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    UpdateMyAiSettingsCommand,
} from "./update-my-ai-settings.command"

@CommandHandler(UpdateMyAiSettingsCommand)
@Injectable()
export class UpdateMyAiSettingsHandler
    extends ICQRSHandler<UpdateMyAiSettingsCommand, void>
    implements ICommandHandler<UpdateMyAiSettingsCommand, void> {
    constructor(
        private readonly aiEntitlementService: AiEntitlementService,
    ) {
        super()
    }

    protected override async process(
        command: UpdateMyAiSettingsCommand,
    ): Promise<void> {
        const {
            request: {
                mode,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // delegate validation + persistence to the domain service
        await this.aiEntitlementService.updateSettings({
            userId: user.id,
            mode,
        })
    }
}
