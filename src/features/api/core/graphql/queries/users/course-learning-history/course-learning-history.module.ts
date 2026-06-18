import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-learning-history.module-definition"
import {
    CourseLearningHistoryResolver,
} from "./course-learning-history.resolver"

@Module({
    providers: [
        CourseLearningHistoryResolver,
    ],
})
export class CourseLearningHistorySingleQueryModule extends ConfigurableModuleClass {}
