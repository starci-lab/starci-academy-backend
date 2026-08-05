import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./tasks.module-definition"
import {
    TaskSingleQueryModule,
} from "./task"
import {
    MilestoneTaskSuggestionsSingleQueryModule,
} from "./milestone-task-suggestions"

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
