import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./system.module-definition"
import {
    SystemConfigQueryModule,
} from "./system-config"
import {
    AiModelsModule,
} from "./ai-models"

@Module({
    imports: [
        SystemConfigQueryModule.register({
            isGlobal: true,
        }),
        AiModelsModule,
    ],
})
export class SystemModule extends ConfigurableModuleClass {}
