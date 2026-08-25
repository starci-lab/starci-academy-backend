import {
    Module 
} from "@nestjs/common"
import {
    MarkAsReadedSingleMutationModule 
} from "./mark-as-readed/mark-as-readed.module"
import {
    ToggleFavouriteSingleMutationModule 
} from "./toggle-favourite/toggle-favourite.module"
import {
    AskContentAiSingleMutationModule 
} from "./ask-content-ai/ask-content-ai.module"
import {
    DeleteContentAiSessionSingleMutationModule 
} from "./delete-content-ai-session/delete-content-ai-session.module"
import {
    CreateContentAiSessionSingleMutationModule 
} from "./create-content-ai-session/create-content-ai-session.module"
import {
    TouchContentAiSessionSingleMutationModule 
} from "./touch-content-ai-session/touch-content-ai-session.module"
import {
    RenameContentAiSessionSingleMutationModule 
} from "./rename-content-ai-session/rename-content-ai-session.module"
import {
    SetContentAiSessionArchivedSingleMutationModule 
} from "./set-content-ai-session-archived/set-content-ai-session-archived.module"
import {
    LearnAiCompanionMutationModule 
} from "./learn-ai-companion/learn-ai-companion.module"
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
        DeleteContentAiSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        CreateContentAiSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        TouchContentAiSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        RenameContentAiSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        SetContentAiSessionArchivedSingleMutationModule.register({
            isGlobal: true,
        }),
        LearnAiCompanionMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/** Composition root that registers every content write globally so the schema picks them up from one import. */
export class ContentsMutationModule extends ConfigurableModuleClass {}
