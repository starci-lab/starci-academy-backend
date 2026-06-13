import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-lab-playground.module-definition"
import {
    AiLabPlaygroundResolver,
} from "./ai-lab-playground.resolver"

@Module({
    providers: [
        AiLabPlaygroundResolver,
    ],
})
export class AiLabPlaygroundSingleQueryModule extends ConfigurableModuleClass {}
