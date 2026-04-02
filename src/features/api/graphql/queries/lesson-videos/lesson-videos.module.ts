import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./lesson-videos.module-definition"
import {
    LessonVideoSingleQueryModule,
} from "./lesson-video"
import {
    LessonVideosSingleQueryModule,
} from "./lesson-videos"

@Module({
    imports: [
        LessonVideosSingleQueryModule.register({
            isGlobal: true,
        }),
        LessonVideoSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class LessonVideosModule extends ConfigurableModuleClass {}
