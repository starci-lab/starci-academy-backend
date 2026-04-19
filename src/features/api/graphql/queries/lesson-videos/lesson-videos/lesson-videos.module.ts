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
import {
    LessonVideosHandler,
} from "./lesson-videos.handler"

@Module({
    providers: [
        LessonVideosService,
        LessonVideosResolver,
        LessonVideosHandler,
    ],
})
export class LessonVideosSingleQueryModule extends ConfigurableModuleClass {}
