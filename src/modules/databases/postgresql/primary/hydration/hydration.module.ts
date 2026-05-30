import {
    Module,
    Provider,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./hydration.module-definition"
import {
    ChallengeHydrationService,
} from "./challenge-hydration.service"
import {
    ConsultantHydrationService,
} from "./consultant-hydration.service"
import {
    ContentHydrationService,
} from "./content-hydration.service"
import {
    CourseHydrationService,
} from "./course-hydration.service"
import {
    FoundationCategoryHydrationService,
} from "./foundation-category-hydration.service"
import {
    FoundationHydrationService,
} from "./foundation-hydration.service"
import {
    HeadhuntingCompanyHydrationService,
} from "./headhunting-company-hydration.service"
import {
    MilestoneHydrationService,
} from "./milestone-hydration.service"
import {
    MilestoneTaskHydrationService,
} from "./milestone-task-hydration.service"
import {
    ModuleHydrationService,
} from "./module-hydration.service"

const hydrationProviders: Array<Provider> = [
    ContentHydrationService,
    ChallengeHydrationService,
    ModuleHydrationService,
    CourseHydrationService,
    FoundationHydrationService,
    FoundationCategoryHydrationService,
    MilestoneHydrationService,
    MilestoneTaskHydrationService,
    ConsultantHydrationService,
    HeadhuntingCompanyHydrationService,
]

/**
 * Loads entity graphs from PostgreSQL as plain objects for CDN / Elasticsearch materialization.
 */
@Module({
    providers: hydrationProviders,
    exports: hydrationProviders,
})
export class HydrationModule extends ConfigurableModuleClass {
}
