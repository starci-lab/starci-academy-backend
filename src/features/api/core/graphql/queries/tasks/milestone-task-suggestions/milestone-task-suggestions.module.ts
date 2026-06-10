import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./milestone-task-suggestions.module-definition"
import {
    MilestoneTaskSuggestionsHandler,
} from "./milestone-task-suggestions.handler"
import {
    MilestoneTaskSuggestionsResolver,
} from "./milestone-task-suggestions.resolver"
import {
    MilestoneTaskSuggestionsService,
} from "./milestone-task-suggestions.service"

@Module({
    providers: [
        MilestoneTaskSuggestionsService,
        MilestoneTaskSuggestionsResolver,
        MilestoneTaskSuggestionsHandler,
    ],
})
export class MilestoneTaskSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
