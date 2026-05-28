import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    UpdateMyAiSettingsResolver,
} from "./update-my-ai-settings.resolver"
import {
    UpdateMyAiSettingsService,
} from "./update-my-ai-settings.service"
import {
    UpdateMyAiSettingsHandler,
} from "./update-my-ai-settings.handler"
import {
    ConfigurableModuleClass,
} from "./update-my-ai-settings.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        UpdateMyAiSettingsResolver,
        UpdateMyAiSettingsService,
        UpdateMyAiSettingsHandler,
    ],
    exports: [
        UpdateMyAiSettingsService,
    ],
})
export class UpdateMyAiSettingsSingleMutationModule extends ConfigurableModuleClass {}
