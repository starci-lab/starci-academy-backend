import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync-elasticsearch.module-definition"
import {
    ElasticsearchChallengesBuildService,
    ElasticsearchContentsBuildService,
    ElasticsearchCoursesBuildService,
    ElasticsearchLessonVideosBuildService,
} from "./build"
import {
    ProcessSyncElasticsearchCompleteStepService,
    ProcessSyncElasticsearchEntityStepService,
} from "./steps"
import {
    SyncElasticsearchStepMappingService,
} from "./step-mapping.service"
import {
    SyncElasticsearchWorker,
} from "./sync-elasticsearch.worker"

@Module({
    providers: [
        ElasticsearchCoursesBuildService,
        ElasticsearchChallengesBuildService,
        ElasticsearchContentsBuildService,
        ElasticsearchLessonVideosBuildService,
        ProcessSyncElasticsearchEntityStepService,
        ProcessSyncElasticsearchCompleteStepService,
        SyncElasticsearchStepMappingService,
        SyncElasticsearchWorker,
    ],
    exports: [
        ElasticsearchCoursesBuildService,
        ElasticsearchChallengesBuildService,
        ElasticsearchContentsBuildService,
        ElasticsearchLessonVideosBuildService,
    ],
})
export class SyncElasticsearchModule extends ConfigurableModuleClass {
}
