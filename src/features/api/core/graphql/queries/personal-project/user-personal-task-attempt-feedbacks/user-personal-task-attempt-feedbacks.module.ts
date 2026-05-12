import {
    Module,
} from "@nestjs/common"
import {
    UserPersonalTaskAttemptFeedbacksResolver,
} from "./user-personal-task-attempt-feedbacks.resolver"
import {
    UserPersonalTaskAttemptFeedbacksService,
} from "./user-personal-task-attempt-feedbacks.service"
import {
    UserPersonalTaskAttemptFeedbacksHandler,
} from "./user-personal-task-attempt-feedbacks.handler"

@Module({
    providers: [
        UserPersonalTaskAttemptFeedbacksResolver,
        UserPersonalTaskAttemptFeedbacksService,
        UserPersonalTaskAttemptFeedbacksHandler,
    ],
})
export class UserPersonalTaskAttemptFeedbacksModule {}
