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
export class MyLearnedLessonsSingleQueryModule extends ConfigurableModuleClass {}
