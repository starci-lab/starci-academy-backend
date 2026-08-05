import {
    ConfigurableModuleClass,
} from "./user-milestone-task-feedbacks.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    UserMilestoneTaskFeedbacksResolver,
} from "./user-milestone-task-feedbacks.resolver"
import {
    UserMilestoneTaskFeedbacksService,
} from "./user-milestone-task-feedbacks.service"
import {
    UserMilestoneTaskFeedbacksHandler,
} from "./user-milestone-task-feedbacks.handler"

@Module({
    providers: [
        UserMilestoneTaskFeedbacksResolver,
        UserMilestoneTaskFeedbacksService,
        UserMilestoneTaskFeedbacksHandler,
    ],
})
/**
 * Nest DI for `userMilestoneTaskFeedbacks` -- latest-attempt feedback list.
 */
export class UserMilestoneTaskFeedbacksSingleQueryModule extends ConfigurableModuleClass {}
