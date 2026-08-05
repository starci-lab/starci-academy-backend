import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./review-personal-project-task.module-definition"
import {
    ReviewPersonalProjectTaskResolver,
} from "./review-personal-project-task.resolver"
import {
    ReviewPersonalProjectTaskService,
} from "./review-personal-project-task.service"
import {
    ReviewPersonalProjectTaskHandler,
} from "./review-personal-project-task.handler"

@Module({
    providers: [
        ReviewPersonalProjectTaskResolver,
        ReviewPersonalProjectTaskService,
        ReviewPersonalProjectTaskHandler,
    ],
})
/**
 * Registers per-task review enqueue as one Nest unit so the personal-project
 * group cannot import a handler without its enrollment guards.
 */
export class ReviewPersonalProjectTaskSingleMutationModule extends ConfigurableModuleClass {}
