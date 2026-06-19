import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    AskContentAiResolver,
} from "./ask-content-ai.resolver"
import {
    AskContentAiService,
} from "./ask-content-ai.service"
import {
    AskContentAiHandler,
} from "./ask-content-ai.handler"
import {
    ConfigurableModuleClass,
} from "./ask-content-ai.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        AskContentAiResolver,
        AskContentAiService,
        AskContentAiHandler,
    ],
    exports: [
        AskContentAiService,
    ],
})
export class AskContentAiSingleMutationModule extends ConfigurableModuleClass {}
