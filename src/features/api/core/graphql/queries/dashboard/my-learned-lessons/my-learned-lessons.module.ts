import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-learned-lessons.module-definition"
import {
    MyLearnedLessonsResolver,
} from "./my-learned-lessons.resolver"

@Module({
    providers: [
        MyLearnedLessonsResolver,
    ],
})
/** Feature-module boundary for the `myLearnedLessons` query — wires its resolver so the dashboard group can mount this widget independently. */
export class MyLearnedLessonsSingleQueryModule extends ConfigurableModuleClass {}
