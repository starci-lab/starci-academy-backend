import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    SyncFlashcardQuizSessionProgressResolver,
} from "./sync-flashcard-quiz-session-progress.resolver"
import {
    SyncFlashcardQuizSessionProgressService,
} from "./sync-flashcard-quiz-session-progress.service"
import {
    SyncFlashcardQuizSessionProgressHandler,
} from "./sync-flashcard-quiz-session-progress.handler"
import {
    ConfigurableModuleClass,
} from "./sync-flashcard-quiz-session-progress.module-definition"

/** Feature-module boundary for the `syncFlashcardQuizSessionProgress` mutation — wires its resolver + service + CQRS handler. */
@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        SyncFlashcardQuizSessionProgressResolver,
        SyncFlashcardQuizSessionProgressService,
        SyncFlashcardQuizSessionProgressHandler,
    ],
    exports: [
        SyncFlashcardQuizSessionProgressService,
    ],
})
export class SyncFlashcardQuizSessionProgressSingleMutationModule extends ConfigurableModuleClass {}
