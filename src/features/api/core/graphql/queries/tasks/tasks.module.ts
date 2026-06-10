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
export class TasksQueriesModule extends ConfigurableModuleClass {}
