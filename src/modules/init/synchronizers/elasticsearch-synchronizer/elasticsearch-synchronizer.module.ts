import {
    Module
    } from "@nestjs/common"
import {
    ConfigurableModuleClass
    } from "./elasticsearch-synchronizer.module-definition"
import {
    ElasticsearchSynchronizerService
    } from "./elasticsearch-synchronizer.service"
import {
    ElasticsearchCourseBuildService,
    ElasticsearchModuleBuildService,
    ElasticsearchContentBuildService,
    ElasticsearchChallengeBuildService,
    ElasticsearchMilestoneBuildService,
    ElasticsearchMilestoneTaskBuildService,
    ElasticsearchFoundationBuildService,
    ElasticsearchFoundationCategoryBuildService,
    ElasticsearchHeadhunterCompanyBuildService,
    ElasticsearchConsultantBuildService
    } from "./builder"

/**
 * Module for synchronizing the Elasticsearch.
 */
@Module({
    providers: [
        ElasticsearchCourseBuildService,
        ElasticsearchModuleBuildService,
        ElasticsearchContentBuildService,
        ElasticsearchChallengeBuildService,
        ElasticsearchMilestoneBuildService,
        ElasticsearchMilestoneTaskBuildService,
        ElasticsearchFoundationBuildService,
        ElasticsearchFoundationCategoryBuildService,
        ElasticsearchHeadhunterCompanyBuildService,
        ElasticsearchConsultantBuildService,
        ElasticsearchSynchronizerService,
    ],
    exports: [
        ElasticsearchSynchronizerService,
    ]
    })
export class ElasticsearchSynchronizerModule extends ConfigurableModuleClass { }
