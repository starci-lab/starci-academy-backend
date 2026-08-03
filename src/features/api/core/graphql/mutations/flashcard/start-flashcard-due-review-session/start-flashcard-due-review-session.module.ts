import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    StartFlashcardDueReviewSessionResolver,
} from "./start-flashcard-due-review-session.resolver"
import {
    StartFlashcardDueReviewSessionService,
} from "./start-flashcard-due-review-session.service"
import {
    StartFlashcardDueReviewSessionHandler,
} from "./start-flashcard-due-review-session.handler"
import {
    ConfigurableModuleClass,
} from "./start-flashcard-due-review-session.module-definition"

/** Feature-module boundary for the `startFlashcardDueReviewSession` mutation — wires its resolver + service + CQRS handler; exports the service so `myInProgressFlashcardDueReviewSession` can share its resolution logic. */
@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        StartFlashcardDueReviewSessionResolver,
        StartFlashcardDueReviewSessionService,
        StartFlashcardDueReviewSessionHandler,
    ],
    exports: [
        StartFlashcardDueReviewSessionService,
    ],
})
export class StartFlashcardDueReviewSessionSingleMutationModule extends ConfigurableModuleClass {}
