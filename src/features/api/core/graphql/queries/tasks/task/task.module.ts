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
/**
 * Wires the enrolled `task` detail query (resolver + QueryBus service +
 * S3-backed handler). Cached by task id at the resolver so repeat opens
 * skip the object-store round-trip.
 */
export class TaskSingleQueryModule extends ConfigurableModuleClass {}
