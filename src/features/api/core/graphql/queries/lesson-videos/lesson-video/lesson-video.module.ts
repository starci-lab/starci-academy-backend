import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./lesson-video.module-definition"
import {
    LessonVideoResolver,
} from "./lesson-video.resolver"
import {
    LessonVideoQueryService,
} from "./lesson-video.service"
import {
    LessonVideoHandler,
} from "./lesson-video.handler"

@Module({
    providers: [
        LessonVideoQueryService,
        LessonVideoResolver,
        LessonVideoHandler,
    ],
})
export class LessonVideoSingleQueryModule extends ConfigurableModuleClass {}
