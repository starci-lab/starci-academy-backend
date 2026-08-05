import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    StartFlashcardReviewSessionResolver,
} from "./start-flashcard-review-session.resolver"
import {
    StartFlashcardReviewSessionService,
} from "./start-flashcard-review-session.service"
import {
    StartFlashcardReviewSessionHandler,
} from "./start-flashcard-review-session.handler"
import {
    ConfigurableModuleClass,
} from "./start-flashcard-review-session.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        StartFlashcardReviewSessionResolver,
        StartFlashcardReviewSessionService,
        StartFlashcardReviewSessionHandler,
    ],
    exports: [
        StartFlashcardReviewSessionService,
    ],
})
/** Feature-module boundary for the `startFlashcardReviewSession` mutation -- wires its resolver + service + CQRS handler; exports the service so `myInProgressFlashcardReviewSession` can share its resolution logic. */
export class StartFlashcardReviewSessionSingleMutationModule extends ConfigurableModuleClass {}
