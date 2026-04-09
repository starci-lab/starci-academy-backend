import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync.module-definition"
import {
    ChallengeFactorySyncService,
    ChallengeRuntimeContextService,
} from "./challenges"
import {
    CourseFactorySyncService,
    CourseRuntimeContextService,
} from "./courses"
import {
    ContentFactorySyncService,
    ContentRuntimeContextService,
} from "./contents"
import {
    LessonVideoFactorySyncService,
    LessonVideoRuntimeContextService,
} from "./lesson-videos"

@Module({
    providers: [
        ChallengeFactorySyncService,
        ChallengeRuntimeContextService,
        // CourseFactorySyncService,
        // CourseRuntimeContextService,
        // LessonVideoFactorySyncService,
        // LessonVideoRuntimeContextService,
        // ContentFactorySyncService,
        // ContentRuntimeContextService,
    ],
})
export class SyncModule extends ConfigurableModuleClass {}
