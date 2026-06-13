import {
    Module,
    Provider,
} from "@nestjs/common"
import {
    TranslationResolverService
} from "./translation.service"
import {
    ChallengeResolverService,
} from "./challenge-resolver.service"
import {
    ContentResolverService,
} from "./content-resolver.service"
import {
    CourseResolverService,
} from "./course-resolver.service"
import {
    CodeExplainingResolverService,
} from "./code-explaining-resolver.service"
import {
    CodeImplementationResolverService,
} from "./code-implementation-resolver.service"
import {
    LivestreamSessionResolverService,
} from "./livestream-session-resolver.service"
import {
    ModuleResolverService,
} from "./module-resolver.service"
import {
    PrerequisiteResolverService,
} from "./prerequisite-resolver.service"
import {
    PreviewContentResolverService,
} from "./preview-content-resolver.service"
import {
    QnaResolverService,
} from "./qna-resolver.service"
import {
    ValuePropositionResolverService,
} from "./value-proposition-resolver.service"
import {
    PersonalProjectContextResolverService,
} from "./personal-project-context-resolver.service"
import {
    MilestoneResolverService,
} from "./milestone-resolver.service"
import {
    MilestoneTaskResolverService,
} from "./milestone-task-resolver.service"
import {
    MilestoneTaskPassCriteriaResolverService,
} from "./milestone-task-pass-criteria-resolver.service"
import {
    MilestoneTaskCodeImplementationResolverService,
} from "./milestone-task-code-implementation-resolver.service"
import {
    FoundationResolverService,
} from "./foundation-resolver.service"
import {
    FoundationCategoryResolverService,
} from "./foundation-category-resolver.service"
import {
    HeadhuntingCompanyResolverService,
} from "./headhunting-company-resolver.service"
import {
    ConsultantResolverService,
} from "./consultant-resolver.service"
import {
    FlashcardCardResolverService,
} from "./flashcard-card-resolver.service"
import {
    FlashcardDeckResolverService,
} from "./flashcard-deck-resolver.service"
import {
    ConfigurableModuleClass
} from "./resolvers.module-definition"

const resolverProviders: Array<Provider> = [
    TranslationResolverService,
    ChallengeResolverService,
    CodeExplainingResolverService,
    CodeImplementationResolverService,
    LivestreamSessionResolverService,
    PreviewContentResolverService,
    PrerequisiteResolverService,
    QnaResolverService,
    ValuePropositionResolverService,
    ContentResolverService,
    CourseResolverService,
    ModuleResolverService,
    PersonalProjectContextResolverService,
    MilestoneResolverService,
    MilestoneTaskResolverService,
    MilestoneTaskPassCriteriaResolverService,
    MilestoneTaskCodeImplementationResolverService,
    FoundationResolverService,
    FoundationCategoryResolverService,
    HeadhuntingCompanyResolverService,
    ConsultantResolverService,
    FlashcardCardResolverService,
    FlashcardDeckResolverService,
]

/**
 * Translation + entity locale resolvers for the primary PostgreSQL connection.
 */
@Module({
    providers: resolverProviders,
    exports: resolverProviders,
})
export class ResolversModule extends ConfigurableModuleClass {
}
