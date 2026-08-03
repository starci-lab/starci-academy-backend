import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard-decks-by-course.module-definition"
import {
    FlashcardDecksByCourseResolver,
} from "./flashcard-decks-by-course.resolver"

/** Feature-module boundary for the `flashcardDecksByCourse` query — wires its resolver (business logic lives in the shared `FlashcardDeckReadService`). */
@Module({
    providers: [
        FlashcardDecksByCourseResolver,
    ],
})
export class FlashcardDecksByCourseSingleQueryModule extends ConfigurableModuleClass {}
