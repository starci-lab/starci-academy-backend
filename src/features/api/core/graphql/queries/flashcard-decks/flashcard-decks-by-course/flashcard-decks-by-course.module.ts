import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard-decks-by-course.module-definition"
import {
    FlashcardDecksByCourseResolver,
} from "./flashcard-decks-by-course.resolver"

@Module({
    providers: [
        FlashcardDecksByCourseResolver,
    ],
})
/** Feature-module boundary for the `flashcardDecksByCourse` query -- wires its resolver (business logic lives in the shared `FlashcardDeckReadService`). */
export class FlashcardDecksByCourseSingleQueryModule extends ConfigurableModuleClass {}
