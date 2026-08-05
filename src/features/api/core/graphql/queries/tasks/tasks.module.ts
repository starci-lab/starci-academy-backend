import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./tasks.module-definition"
import {
    TaskSingleQueryModule,
} from "./task/task.module"
import {
    MilestoneTaskSuggestionsSingleQueryModule,
} from "./milestone-task-suggestions/milestone-task-suggestions.module"

@Module({
    imports: [
        TaskSingleQueryModule.register({
            isGlobal: true,
        }),
        MilestoneTaskSuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Milestone-task query group: the enrolled `task` detail page plus
 * `milestoneTaskSuggestions` typeahead for editors and search.
 */
export class TasksQueriesModule extends ConfigurableModuleClass {}
