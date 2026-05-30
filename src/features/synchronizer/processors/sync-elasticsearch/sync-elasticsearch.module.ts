import {
    Module
    } from "@nestjs/common"
import {
    ConfigurableModuleClass
    } from "./sync-elasticsearch.module-definition"
import {
    ElasticsearchChallengeBuildService,
    ElasticsearchContentBuildService,
    ElasticsearchCourseBuildService,
    ElasticsearchModuleBuildService,
    ElasticsearchFoundationBuildService,
    ElasticsearchFoundationCategoryBuildService,
    ElasticsearchHeadhunterCompanyBuildService,
    ElasticsearchConsultantBuildService
    } from "./builder"
import {
    ProcessSyncElasticsearchCompleteStepService,
    ProcessSyncElasticsearchEntityStepService
    } from "./steps"
import {
    SyncElasticsearchStepMappingService
    } from "./step-mapping.service"

@Module({
    providers: [
        ElasticsearchCourseBuildService,
        ElasticsearchChallengeBuildService,
        ElasticsearchContentBuildService,
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
        ElasticsearchModuleBuildService,
        ElasticsearchFoundationBuildService,
        ElasticsearchFoundationCategoryBuildService,
        ElasticsearchHeadhunterCompanyBuildService,
        ElasticsearchConsultantBuildService,
    ]
    })
export class SyncElasticsearchModule extends ConfigurableModuleClass {
}
