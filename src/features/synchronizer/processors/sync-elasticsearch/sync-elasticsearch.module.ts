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
    ElasticsearchHeadhunterCompanyBuildService,
    ElasticsearchConsultantBuildService,
} from "./builder"
import {
    ProcessSyncElasticsearchCompleteStepService,
    ProcessSyncElasticsearchEntityStepService,
} from "./steps"
import {
    SyncElasticsearchStepMappingService,
} from "./step-mapping.service"

@Module({
    providers: [
        ElasticsearchCourseBuildService,
        ElasticsearchChallengeBuildService,
        ElasticsearchContentBuildService,
        ElasticsearchLessonVideoBuildService,
        ProcessSyncElasticsearchEntityStepService,
        ProcessSyncElasticsearchCompleteStepService,
        SyncElasticsearchStepMappingService,
        ElasticsearchModuleBuildService,
        ElasticsearchFoundationBuildService,
        ElasticsearchFoundationCategoryBuildService,
        ElasticsearchHeadhunterCompanyBuildService,
        ElasticsearchConsultantBuildService,
    ],
    exports: [
        ElasticsearchCourseBuildService,
        ElasticsearchChallengeBuildService,
        ElasticsearchContentBuildService,
        ElasticsearchLessonVideoBuildService,
        ElasticsearchModuleBuildService,
        ElasticsearchFoundationBuildService,
        ElasticsearchFoundationCategoryBuildService,
        ElasticsearchHeadhunterCompanyBuildService,
        ElasticsearchConsultantBuildService,
    ],
})
export class SyncElasticsearchModule extends ConfigurableModuleClass {
}
