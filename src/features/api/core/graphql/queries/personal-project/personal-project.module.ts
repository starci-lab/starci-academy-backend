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

@Module({
    imports: [
        UserPersonalTaskAttemptsModule,
        UserPersonalTaskAttemptFeedbacksModule,
        MilestoneTaskProgressModule,
    ],
})
export class PersonalProjectQueriesModule extends ConfigurableModuleClass {}
