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
    ElasticsearchConsultantBuildService,
    ElasticsearchFlashcardDeckBuildService,
    ElasticsearchCodingProblemBuildService
} from "./builder"

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
        ElasticsearchFlashcardDeckBuildService,
        ElasticsearchCodingProblemBuildService,
        ElasticsearchSynchronizerService,
    ],
    exports: [
        ElasticsearchSynchronizerService,
    ]
})
/**
 * Module for synchronizing the Elasticsearch.
 */
export class ElasticsearchSynchronizerModule extends ConfigurableModuleClass { }
