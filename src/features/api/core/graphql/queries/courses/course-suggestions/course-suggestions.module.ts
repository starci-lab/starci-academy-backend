import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-suggestions.module-definition"
import {
    CourseSuggestionsHandler,
} from "./course-suggestions.handler"
import {
    CourseSuggestionsResolver,
} from "./course-suggestions.resolver"
import {
    CourseSuggestionsService,
} from "./course-suggestions.service"

@Module({
    providers: [
        CourseSuggestionsService,
        CourseSuggestionsResolver,
        CourseSuggestionsHandler,
    ],
})
export class CourseSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
