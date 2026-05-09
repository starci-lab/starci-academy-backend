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
export class ReviewPersonalProjectTaskMutationModule extends ConfigurableModuleClass {}
