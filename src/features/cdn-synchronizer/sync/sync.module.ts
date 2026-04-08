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
    CourseRuntimeContextService,
    CourseFactorySyncService
} from "./courses"
// import { 
//     ModuleRuntimeContextService,
//     ModuleFactorySyncService
// } from "./modules"
import { 
    LessonVideoRuntimeContextService,
    LessonVideoFactorySyncService
} from "./lesson-videos"

@Module({
    providers: [
        ChallengeRuntimeContextService,
        ChallengeFactorySyncService,
        CourseRuntimeContextService,
        CourseFactorySyncService,
        // ModuleRuntimeContextService,
        // ModuleFactorySyncService,
        LessonVideoRuntimeContextService,
        LessonVideoFactorySyncService,
    ],
})
export class SyncModule extends ConfigurableModuleClass {}

