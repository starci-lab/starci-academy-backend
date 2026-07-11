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
