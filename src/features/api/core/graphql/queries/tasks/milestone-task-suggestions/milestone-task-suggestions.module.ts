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
/**
 * Wires the `milestoneTaskSuggestions` typeahead (ES prefix match on
 * milestone tasks). Editors and search bars use this instead of loading the
 * full task catalog.
 */
export class MilestoneTaskSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
