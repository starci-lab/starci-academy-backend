import {
    ConfigurableModuleClass,
} from "./milestone-task-progress.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    MilestoneTaskProgressResolver,
} from "./milestone-task-progress.resolver"
import {
    MilestoneTaskProgressService,
} from "./milestone-task-progress.service"
import {
    MilestoneTaskProgressHandler,
} from "./milestone-task-progress.handler"
import {
    MilestoneTaskProgressListener,
} from "./milestone-task-progress.listener"

@Module({
    providers: [
        MilestoneTaskProgressResolver,
        MilestoneTaskProgressService,
        MilestoneTaskProgressHandler,
        MilestoneTaskProgressListener,
    ],
})
export class MilestoneTaskProgressSingleQueryModule extends ConfigurableModuleClass {}
