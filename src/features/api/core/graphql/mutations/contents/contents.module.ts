import {
    Module,
} from "@nestjs/common"
import {
    MarkAsReadedSingleMutationModule,
} from "./mark-as-readed"
import {
    ToggleFavouriteSingleMutationModule,
} from "./toggle-favourite"
import {
    AskContentAiSingleMutationModule,
} from "./ask-content-ai"
import {
    ClearContentAiHistorySingleMutationModule,
} from "./clear-content-ai-history"
import {
    CreateContentAiSessionSingleMutationModule,
} from "./create-content-ai-session"
import {
    TouchContentAiSessionSingleMutationModule,
} from "./touch-content-ai-session"
import {
    ConfigurableModuleClass
} from "./contents.module-definition"

@Module({
    imports: [
        MarkAsReadedSingleMutationModule.register({
            isGlobal: true,
        }),
        ToggleFavouriteSingleMutationModule.register({
            isGlobal: true,
        }),
        AskContentAiSingleMutationModule.register({
            isGlobal: true,
        }),
        ClearContentAiHistorySingleMutationModule.register({
            isGlobal: true,
        }),
        CreateContentAiSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        TouchContentAiSessionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class ContentsMutationModule extends ConfigurableModuleClass { }
