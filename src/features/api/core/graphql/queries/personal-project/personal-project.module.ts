import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./personal-project.module-definition"
import {
    UserPersonalTaskAttemptsSingleQueryModule,
} from "./user-personal-task-attempts"
import {
    UserPersonalTaskAttemptFeedbacksSingleQueryModule,
} from "./user-personal-task-attempt-feedbacks"
import {
    MilestoneTaskProgressSingleQueryModule,
} from "./milestone-task-progress"
import {
    LastPersonalTaskAttemptSingleQueryModule,
} from "./last-personal-task-attempt"
import {
    UserMilestoneTaskFeedbacksSingleQueryModule,
} from "./user-milestone-task-feedbacks"

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
