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
    ],
})
export class ContentsMutationModule extends ConfigurableModuleClass { }
