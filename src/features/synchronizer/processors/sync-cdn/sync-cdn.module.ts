import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync-cdn.module-definition"
import {
    CdnChallengesBuildService,
    CdnContentsBuildService,
    CdnCoursesBuildService,
    CdnLessonVideosBuildService,
    CdnModulesBuildService,
} from "./build"
import {
    ProcessCdnEntityStepService,
    ProcessCdnCompleteStepService,
} from "./steps"
import {
    SyncCdnStepMappingService,
} from "./step-mapping.service"
import {
    SyncCdnWorker,
} from "./sync-cdn.worker"

@Module({
    providers: [
        CdnCoursesBuildService,
        CdnModulesBuildService,
        CdnChallengesBuildService,
        CdnContentsBuildService,
        CdnLessonVideosBuildService,
        ProcessCdnEntityStepService,
        ProcessCdnCompleteStepService,
        SyncCdnStepMappingService,
        SyncCdnWorker,
    ],
    exports: [
        CdnCoursesBuildService,
        CdnModulesBuildService,
        CdnChallengesBuildService,
        CdnContentsBuildService,
        CdnLessonVideosBuildService,
    ],
})
export class SyncCdnModule extends ConfigurableModuleClass {
}
