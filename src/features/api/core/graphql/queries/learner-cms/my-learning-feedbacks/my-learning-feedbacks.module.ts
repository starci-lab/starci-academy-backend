import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-learning-feedbacks.module-definition"
import {
    MyLearningFeedbacksResolver,
} from "./my-learning-feedbacks.resolver"

@Module({
    providers: [
        MyLearningFeedbacksResolver,
    ],
})
export class MyLearningFeedbacksSingleQueryModule extends ConfigurableModuleClass {}
