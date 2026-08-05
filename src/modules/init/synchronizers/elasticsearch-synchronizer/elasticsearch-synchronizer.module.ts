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
    ElasticsearchChallengeBuildService,
} from "./builder/challenge.service"
import {
    ElasticsearchCodingProblemBuildService,
} from "./builder/coding-problem.service"
import {
    ElasticsearchConsultantBuildService,
} from "./builder/consultant.service"
import {
    ElasticsearchContentBuildService,
} from "./builder/content.service"
import {
    ElasticsearchCourseBuildService,
} from "./builder/course.service"
import {
    ElasticsearchFlashcardDeckBuildService,
} from "./builder/flashcard-deck.service"
import {
    ElasticsearchFoundationCategoryBuildService,
} from "./builder/foundation-category.service"
import {
    ElasticsearchFoundationBuildService,
} from "./builder/foundation.service"
import {
    ElasticsearchHeadhunterCompanyBuildService,
} from "./builder/headhunting-company.service"
import {
    ElasticsearchMilestoneTaskBuildService,
} from "./builder/milestone-task.service"
import {
    ElasticsearchMilestoneBuildService,
} from "./builder/milestone.service"
import {
    ElasticsearchModuleBuildService,
} from "./builder/module.service"

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
