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
export class FlashcardDecksByCourseSingleQueryModule extends ConfigurableModuleClass {}
