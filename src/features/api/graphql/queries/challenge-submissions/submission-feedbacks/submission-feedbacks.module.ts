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

@Module({
    providers: [
        SubmissionFeedbacksService,
        SubmissionFeedbacksResolver,
    ],  
})  
export class SubmissionFeedbacksModule extends ConfigurableModuleClass {}
