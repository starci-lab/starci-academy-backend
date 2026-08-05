import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./personal-project.module-definition"
import {
    UserPersonalTaskAttemptsSingleQueryModule,
} from "./user-personal-task-attempts/user-personal-task-attempts.module"
import {
    UserPersonalTaskAttemptFeedbacksSingleQueryModule,
} from "./user-personal-task-attempt-feedbacks/user-personal-task-attempt-feedbacks.module"
import {
    MilestoneTaskProgressSingleQueryModule,
} from "./milestone-task-progress/milestone-task-progress.module"
import {
    LastPersonalTaskAttemptSingleQueryModule,
} from "./last-personal-task-attempt/last-personal-task-attempt.module"
import {
    UserMilestoneTaskFeedbacksSingleQueryModule,
} from "./user-milestone-task-feedbacks/user-milestone-task-feedbacks.module"

@Module({
    imports: [
        UserPersonalTaskAttemptsSingleQueryModule.register({
            isGlobal: true,
        }),
        UserPersonalTaskAttemptFeedbacksSingleQueryModule.register({
            isGlobal: true,
        }),
        UserMilestoneTaskFeedbacksSingleQueryModule.register({
            isGlobal: true,
        }),
        MilestoneTaskProgressSingleQueryModule.register({
            isGlobal: true,
        }),
        LastPersonalTaskAttemptSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Aggregates personal-project query modules (attempts, feedbacks, progress,
 * last attempt) as global Nest imports.
 */
export class PersonalProjectQueriesModule extends ConfigurableModuleClass {}
