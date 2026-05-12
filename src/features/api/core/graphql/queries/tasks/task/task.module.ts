import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./task.module-definition"
import {
    TaskResolver,
} from "./task.resolver"
import {
    TaskService,
} from "./task.service"
import {
    TaskHandler,
} from "./task.handler"

@Module({
    providers: [
        TaskService,
        TaskResolver,
        TaskHandler,
    ],
})
export class TaskSingleQueryModule extends ConfigurableModuleClass {}
