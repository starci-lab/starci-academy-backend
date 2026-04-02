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

@Module({
    providers: [
        LessonVideoQueryService,
        LessonVideoResolver,
    ],
})
export class LessonVideoSingleQueryModule extends ConfigurableModuleClass {}
