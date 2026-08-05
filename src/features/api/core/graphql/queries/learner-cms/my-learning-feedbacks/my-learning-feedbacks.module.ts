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
/** Feature-module boundary for the `myLearningFeedbacks` query -- wires its resolver. */
export class MyLearningFeedbacksSingleQueryModule extends ConfigurableModuleClass {}
