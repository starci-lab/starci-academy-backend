import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./tasks.module-definition"
import {
    TaskSingleQueryModule,
} from "./task"

@Module({
    imports: [
        TaskSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class TasksQueriesModule extends ConfigurableModuleClass {}
