import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-ai-settings.module-definition"
import {
    MyAiSettingsResolver,
} from "./my-ai-settings.resolver"

@Module({
    providers: [
        MyAiSettingsResolver,
    ],
})
export class MyAiSettingsSingleQueryModule extends ConfigurableModuleClass {}
