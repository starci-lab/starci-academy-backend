import {
    Module,
} from "@nestjs/common"
import {
    PersonalFeedbacksResolver,
} from "./personal-feedbacks.resolver"
import {
    PersonalFeedbacksService,
} from "./personal-feedbacks.service"
import {
    PersonalFeedbacksHandler,
} from "./personal-feedbacks.handler"

@Module({
    providers: [
        PersonalFeedbacksResolver,
        PersonalFeedbacksService,
        PersonalFeedbacksHandler,
    ],
})
export class PersonalFeedbacksModule {}
