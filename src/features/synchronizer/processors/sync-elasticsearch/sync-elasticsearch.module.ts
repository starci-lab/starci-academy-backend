import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync-elasticsearch.module-definition"
import {
    ElasticsearchChallengeBuildService,
    ElasticsearchContentBuildService,
    ElasticsearchCourseBuildService,
    ElasticsearchLessonVideoBuildService,
    ElasticsearchModuleBuildService,
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
        ElasticsearchCourseBuildService,
        ElasticsearchChallengeBuildService,
        ElasticsearchContentBuildService,
        ElasticsearchLessonVideoBuildService,
        ProcessSyncElasticsearchEntityStepService,
        ProcessSyncElasticsearchCompleteStepService,
        SyncElasticsearchStepMappingService,
        SyncElasticsearchWorker,
        ElasticsearchModuleBuildService,
    ],
    exports: [
        ElasticsearchCourseBuildService,
        ElasticsearchChallengeBuildService,
        ElasticsearchContentBuildService,
        ElasticsearchLessonVideoBuildService,
        ElasticsearchModuleBuildService,
    ],
})
export class SyncElasticsearchModule extends ConfigurableModuleClass {
}
