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
/** Feature-module boundary for the `courseLearningHistory` query -- wires its resolver so the users group can mount this profile tab independently. */
export class CourseLearningHistorySingleQueryModule extends ConfigurableModuleClass {}
