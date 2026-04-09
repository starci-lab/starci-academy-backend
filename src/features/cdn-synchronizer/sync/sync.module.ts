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
import { 
    ModuleFactorySyncService,
    ModuleRuntimeContextService,
    
} from "./modules"
import { 
    LessonVideoRuntimeContextService,
    LessonVideoFactorySyncService
} from "./lesson-videos"
import { 
    ContentRuntimeContextService,
    ContentFactorySyncService
} from "./contents"

@Module({
    providers: [
        ChallengeRuntimeContextService,
        ChallengeFactorySyncService,
        CourseRuntimeContextService,
        CourseFactorySyncService,
        ModuleRuntimeContextService,
        ModuleFactorySyncService,
        LessonVideoRuntimeContextService,
        LessonVideoFactorySyncService,
        ContentRuntimeContextService,
        ContentFactorySyncService,
    ],
})
export class SyncModule extends ConfigurableModuleClass {}

