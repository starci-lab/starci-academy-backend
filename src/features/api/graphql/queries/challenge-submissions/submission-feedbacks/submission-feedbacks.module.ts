import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submission-feedbacks.module-definition"
import {
    SubmissionFeedbacksResolver,
} from "./submission-feedbacks.resolver"
import {
    SubmissionFeedbacksService,
} from "./submission-feedbacks.service"
import {
    SubmissionFeedbacksHandler,
} from "./submission-feedbacks.handler"

@Module({
    providers: [
        SubmissionFeedbacksService,
        SubmissionFeedbacksResolver,
        SubmissionFeedbacksHandler,
    ],
})
export class SubmissionFeedbacksModule extends ConfigurableModuleClass {}
