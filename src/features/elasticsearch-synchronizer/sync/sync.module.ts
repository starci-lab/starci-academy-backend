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

@Module({
    providers: [
        ChallengeFactorySyncService,
        ChallengeRuntimeContextService,
        CourseFactorySyncService,
        CourseRuntimeContextService,
    ],
})
export class SyncModule extends ConfigurableModuleClass {}
