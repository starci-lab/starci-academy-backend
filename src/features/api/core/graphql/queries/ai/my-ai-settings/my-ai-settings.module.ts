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
/** Feature-module boundary for the `myAiSettings` query — wires its resolver so the AI group can mount this read independently. */
export class MyAiSettingsSingleQueryModule extends ConfigurableModuleClass {}
