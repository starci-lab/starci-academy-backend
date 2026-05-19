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
    ElasticsearchFoundationBuildService,
    ElasticsearchFoundationCategoryBuildService,
} from "./builder"
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
        ElasticsearchFoundationBuildService,
        ElasticsearchFoundationCategoryBuildService,
    ],
    exports: [
        ElasticsearchCourseBuildService,
        ElasticsearchChallengeBuildService,
        ElasticsearchContentBuildService,
        ElasticsearchLessonVideoBuildService,
        ElasticsearchModuleBuildService,
        ElasticsearchFoundationBuildService,
        ElasticsearchFoundationCategoryBuildService,
    ],
})
export class SyncElasticsearchModule extends ConfigurableModuleClass {
}
