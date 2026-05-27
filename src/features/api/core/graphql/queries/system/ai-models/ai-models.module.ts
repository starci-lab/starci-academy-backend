import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-models.module-definition"
import {
    AiModelsResolver,
} from "./ai-models.resolver"
import {
    AiModelsService,
} from "./ai-models.service"
import {
    AiModelsHandler,
} from "./ai-models.handler"

@Module({
    providers: [
        AiModelsResolver,
        AiModelsService,
        AiModelsHandler,
    ],
})
export class AiModelsSingleQueryModule extends ConfigurableModuleClass {}
