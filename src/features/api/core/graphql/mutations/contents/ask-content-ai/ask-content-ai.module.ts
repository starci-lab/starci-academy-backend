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
/** Isolated Nest registration so ask-content-ai can be global without pulling sibling content mutations into the same DI graph. */
export class AskContentAiSingleMutationModule extends ConfigurableModuleClass {}
