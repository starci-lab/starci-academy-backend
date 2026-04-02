import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./lesson-videos.module-definition"
import {
    LessonVideosResolver,
} from "./lesson-videos.resolver"
import {
    LessonVideosService,
} from "./lesson-videos.service"

@Module({
    providers: [
        LessonVideosService,
        LessonVideosResolver,
    ],
})
export class LessonVideosSingleQueryModule extends ConfigurableModuleClass {}
