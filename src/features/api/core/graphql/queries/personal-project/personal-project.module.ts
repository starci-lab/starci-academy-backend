import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./personal-project.module-definition"
import {
    UserPersonalTaskAttemptsModule,
} from "./user-personal-task-attempts"
import {
    UserPersonalTaskAttemptFeedbacksModule,
} from "./user-personal-task-attempt-feedbacks"
import {
    MilestoneTaskProgressModule,
} from "./milestone-task-progress"
import {
    LastPersonalTaskAttemptModule,
} from "./last-personal-task-attempt"
import {
    UserMilestoneTaskFeedbacksModule,
} from "./user-milestone-task-feedbacks"

@Module({
    imports: [
        UserPersonalTaskAttemptsModule,
        UserPersonalTaskAttemptFeedbacksModule,
        UserMilestoneTaskFeedbacksModule,
        MilestoneTaskProgressModule,
        LastPersonalTaskAttemptModule,
    ],
})
export class PersonalProjectQueriesModule extends ConfigurableModuleClass {}
