import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ChallengeOutputIdFactoryService,
} from "./courses/id-factories/challenge-output.service"
import {
    ChallengePrerequisiteIdFactoryService,
} from "./courses/id-factories/challenge-prerequisite.service"
import {
    ChallengeRequirementIdFactoryService,
} from "./courses/id-factories/challenge-requirement.service"
import {
    ChallengeStepIdFactoryService,
} from "./courses/id-factories/challenge-step.service"
import {
    ChallengeSubmissionCriteriaIdFactoryService,
} from "./courses/id-factories/challenge-submission-criteria.service"
import {
    ChallengeSubmissionPromptIdFactoryService,
} from "./courses/id-factories/challenge-submission-prompt.service"
import {
    ChallengeSubmissionIdFactoryService,
} from "./courses/id-factories/challenge-submission.service"
import {
    ChallengeIdFactoryService,
} from "./courses/id-factories/challenge.service"
import {
    CodeExplainingIdFactoryService,
} from "./courses/id-factories/code-explaining.service"
import {
    CodeImplementationIdFactoryService,
} from "./courses/id-factories/code-implementation.service"
import {
    ContentBodyIdFactoryService,
} from "./courses/id-factories/content-body.service"
import {
    ContentLearningOutcomeIdFactoryService,
} from "./courses/id-factories/content-learning-outcome.service"
import {
    ContentIdFactoryService,
} from "./courses/id-factories/content.service"
import {
    CourseIdFactoryService,
} from "./courses/id-factories/course.service"
import {
    FlashcardCardIdFactoryService,
} from "./courses/id-factories/flashcard-card.service"
import {
    FlashcardDeckIdFactoryService,
} from "./courses/id-factories/flashcard-deck.service"
import {
    LivestreamSessionIdFactoryService,
} from "./courses/id-factories/livestream-session.service"
import {
    MilestoneTaskApproachCriteriaLangIdFactoryService,
} from "./courses/id-factories/milestone-task-approach-criteria-lang.service"
import {
    MilestoneTaskApproachCriteriaIdFactoryService,
} from "./courses/id-factories/milestone-task-approach-criteria.service"
import {
    MilestoneTaskBriefIdFactoryService,
} from "./courses/id-factories/milestone-task-brief.service"
import {
    MilestoneTaskCodeImplementationIdFactoryService,
} from "./courses/id-factories/milestone-task-code-implementation.service"
import {
    MilestoneTaskOutcomeCriteriaLangIdFactoryService,
} from "./courses/id-factories/milestone-task-outcome-criteria-lang.service"
import {
    MilestoneTaskOutcomeCriteriaIdFactoryService,
} from "./courses/id-factories/milestone-task-outcome-criteria.service"
import {
    MilestoneTaskPassCriteriaIdFactoryService,
} from "./courses/id-factories/milestone-task-pass-criteria.service"
import {
    MilestoneTaskIdFactoryService,
} from "./courses/id-factories/milestone-task.service"
import {
    MilestoneIdFactoryService,
} from "./courses/id-factories/milestone.service"
import {
    MockInterviewChecklistIdFactoryService,
} from "./courses/id-factories/mock-interview-checklist.service"
import {
    MockInterviewLangIdFactoryService,
} from "./courses/id-factories/mock-interview-lang.service"
import {
    MockInterviewIdFactoryService,
} from "./courses/id-factories/mock-interview.service"
import {
    ModuleIdFactoryService,
} from "./courses/id-factories/module.service"
import {
    PlaygroundStepIdFactoryService,
} from "./courses/id-factories/playground-step.service"
import {
    PlaygroundIdFactoryService,
} from "./courses/id-factories/playground.service"
import {
    PrerequisiteIdFactoryService,
} from "./courses/id-factories/prerequisite.service"
import {
    PreviewContentIdFactoryService,
} from "./courses/id-factories/preview-content.service"
import {
    PricingPhaseIdFactoryService,
} from "./courses/id-factories/pricing-phase.service"
import {
    QnaIdFactoryService,
} from "./courses/id-factories/qna.service"
import {
    ValuePropositionIdFactoryService,
} from "./courses/id-factories/value-proposition.service"
import {
    ChallengeParserService,
} from "./courses/parsers/challenge.service"
import {
    ContentParserService,
} from "./courses/parsers/content.service"
import {
    CourseParserService,
} from "./courses/parsers/course.service"
import {
    FlashcardDeckParserService,
} from "./courses/parsers/flashcard-deck.service"
import {
    MilestoneTaskParserService,
} from "./courses/parsers/milestone-task.service"
import {
    MilestoneParserService,
} from "./courses/parsers/milestone.service"
import {
    MockInterviewParserService,
} from "./courses/parsers/mock-interview.service"
import {
    ModuleParserService,
} from "./courses/parsers/module.service"
import {
    PlaygroundStepParserService,
} from "./courses/parsers/playground-step.service"
import {
    PlaygroundParserService,
} from "./courses/parsers/playground.service"
import {
    ChallengePathService,
} from "./courses/path/challenge.service"
import {
    ContentPathService,
} from "./courses/path/content.service"
import {
    CoursePathService,
} from "./courses/path/course.service"
import {
    FlashcardDeckPathService,
} from "./courses/path/flashcard-deck.service"
import {
    MilestoneTaskPathService,
} from "./courses/path/milestone-task.service"
import {
    MilestonePathService,
} from "./courses/path/milestone.service"
import {
    MockInterviewPathService,
} from "./courses/path/mock-interview.service"
import {
    ModulePathService,
} from "./courses/path/module.service"
import {
    PlaygroundStepPathService,
} from "./courses/path/playground-step.service"
import {
    PlaygroundPathService,
} from "./courses/path/playground.service"
import {
    CourseSeederService,
} from "./courses/seeder.service"
import {
    ChallengeProcessorService,
} from "./courses/processors/challenge-processor.service"
import {
    ContentProcessorService,
} from "./courses/processors/content-processor.service"
import {
    CourseProcessorService,
} from "./courses/processors/course-processor.service"
import {
    FlashcardDeckProcessorService,
} from "./courses/processors/flashcard-deck-processor.service"
import {
    MilestoneProcessorService,
} from "./courses/processors/milestone-processor.service"
import {
    MilestoneTaskProcessorService,
} from "./courses/processors/milestone-task-processor.service"
import {
    MockInterviewProcessorService,
} from "./courses/processors/mock-interview-processor.service"
import {
    ModuleProcessorService,
} from "./courses/processors/module-processor.service"
import {
    PlaygroundProcessorService,
} from "./courses/processors/playground-processor.service"
import {
    UuidPartitionPersistProcessorService,
} from "./courses/processors/uuid-partition-persist-processor.service"
import {
    TemplateCvIdFactoryService,
} from "./cv/id-factories/template-cv.service"
import {
    TemplateCvInsertService,
} from "./cv/inserts/template-cv-insert.service"
import {
    TemplateCvParserService,
} from "./cv/parsers/template-cv.service"
import {
    TemplateCvPathService,
} from "./cv/path/template-cv.service"
import {
    CvSeederService,
} from "./cv/seeder.service"
import {
    FoundationCategoryIdFactoryService,
} from "./foundations/id-factories/foundation-category.service"
import {
    FoundationTagIdFactoryService,
} from "./foundations/id-factories/foundation-tag.service"
import {
    FoundationIdFactoryService,
} from "./foundations/id-factories/foundation.service"
import {
    FoundationCategoryInsertService,
} from "./foundations/inserts/foundation-category-insert.service"
import {
    FoundationInsertService,
} from "./foundations/inserts/foundation-insert.service"
import {
    FoundationCategoryParserService,
} from "./foundations/parsers/foundation-category.service"
import {
    FoundationTagParserService,
} from "./foundations/parsers/foundation-tag.service"
import {
    FoundationParserService,
} from "./foundations/parsers/foundation.service"
import {
    FoundationCategoryPathService,
} from "./foundations/path/foundation-category.service"
import {
    FoundationPathService,
} from "./foundations/path/foundation.service"
import {
    FoundationSeederService,
} from "./foundations/seeder.service"
import {
    CatalogSeederService,
} from "./catalog/catalog-seeder.service"
import {
    AiModelInsertService,
} from "./catalog/inserts/ai-model-insert.service"
import {
    AiModelCatalogParserService,
} from "./catalog/parsers/ai-model-catalog.parser"
import {
    SubscriptionCatalogParserService,
} from "./catalog/parsers/subscription-catalog.parser"
import {
    AiModelCatalogPathService,
} from "./catalog/path/ai-model-catalog.path"
import {
    SubscriptionCatalogPathService,
} from "./catalog/path/subscription-catalog.path"
import {
    ConsultantIdFactoryService,
} from "./headhuntings/id-factories/consultant.service"
import {
    HeadhuntingCompanyIdFactoryService,
} from "./headhuntings/id-factories/headhunting-company.service"
import {
    ConsultantInsertService,
} from "./headhuntings/inserts/consultant-insert.service"
import {
    HeadhuntingCompanyInsertService,
} from "./headhuntings/inserts/headhunting-company-insert.service"
import {
    ConsultantParserService,
} from "./headhuntings/parsers/consultant.service"
import {
    HeadhuntingCompanyParserService,
} from "./headhuntings/parsers/headhunting-company.service"
import {
    ConsultantPathService,
} from "./headhuntings/path/consultant.service"
import {
    HeadhuntingCompanyPathService,
} from "./headhuntings/path/headhunting-company.service"
import {
    HeadhuntingSeederService,
} from "./headhuntings/seeder.service"
import {
    CodingProblemSeederService,
} from "./coding-problems/coding-problem-seeder.service"
import {
    CodingProblemHintIndexService,
} from "./coding-problems/hints/coding-problem-hint-index.service"
import {
    CodingProblemInsertService,
} from "./coding-problems/inserts/coding-problem-insert.service"
import {
    CodingProblemParserService,
} from "./coding-problems/parsers/coding-problem-parser.service"
import {
    CodingProblemPathService,
} from "./coding-problems/path/coding-problem-path.service"
import {
    AdvertisementSeederService,
} from "./advertisements/advertisement-seeder.service"
import {
    ChangelogSeederService,
} from "./changelog/changelog-seeder.service"
import {
    BlogSeederService,
} from "./blog/blog-seeder.service"
import {
    AchievementSeederService,
} from "./achievements/achievement-seeder.service"
import {
    InterviewQuestionEqIdFactoryService,
} from "./mock-interview-eq/id-factories/interview-question-eq-id-factory.service"
import {
    MockInterviewEqSeederService,
} from "./mock-interview-eq/mock-interview-eq-seeder.service"
import {
    InterviewQuestionEqParserService,
} from "./mock-interview-eq/parsers/interview-question-eq-parser.service"
import {
    InterviewQuestionEqPathService,
} from "./mock-interview-eq/path/interview-question-eq-path.service"
import {
    SeedersService,
} from "./seeders.service"
import {
    ConfigurableModuleClass, OPTIONS_TYPE 
} from "./seeders.module-definition"
import {
    FilesystemContextService,
} from "./shared/contexts/filesystem.service"
import {
    ContextLoaderService,
} from "./shared/contexts/loader.service"
import {
    S3ContextService,
} from "./shared/contexts/s3.service"
import {
    CoerceMdScalarService,
} from "./shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService,
} from "./shared/extracts/extract-json-from-md.service"
import {
    InterviewQuestionFieldsService,
} from "./shared/interview-question-fields.service"
import {
    MergeJsonService,
} from "./shared/merge/merge.service"
import {
    PathResolverService,
} from "./shared/path/resolver.service"
import {
    UpsertService,
} from "./shared/upsert/upsert.service"


@Module({
})
/**
 * Module for the Seeders.
 * Provides all parser services and the SeedersService.
 */
export class SeedersModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE
    ): DynamicModule {
        const dynamicModule = super.register(options)
        const providers = [
            ExtractJsonFromMdService,
            CoerceMdScalarService,
            MergeJsonService,
            S3ContextService,
            FilesystemContextService,
            ContextLoaderService,
            InterviewQuestionFieldsService,
            CourseIdFactoryService,
            ModuleIdFactoryService,
            ContentIdFactoryService,
            CodeExplainingIdFactoryService,
            CodeImplementationIdFactoryService,
            ContentBodyIdFactoryService,
            ContentLearningOutcomeIdFactoryService,
            PreviewContentIdFactoryService,
            PricingPhaseIdFactoryService,
            ValuePropositionIdFactoryService,
            PrerequisiteIdFactoryService,
            QnaIdFactoryService,
            LivestreamSessionIdFactoryService,
            CoursePathService,
            ModulePathService,
            ContentPathService,
            ChallengePathService,
            FlashcardDeckPathService,
            FlashcardDeckIdFactoryService,
            FlashcardCardIdFactoryService,
            PlaygroundPathService,
            PlaygroundStepPathService,
            PlaygroundIdFactoryService,
            PlaygroundStepIdFactoryService,
            MockInterviewPathService,
            MockInterviewIdFactoryService,
            MockInterviewLangIdFactoryService,
            MockInterviewChecklistIdFactoryService,
            ChallengeIdFactoryService,
            ChallengeSubmissionIdFactoryService,
            ChallengeSubmissionPromptIdFactoryService,
            ChallengeSubmissionCriteriaIdFactoryService,
            ChallengeRequirementIdFactoryService,
            ChallengeStepIdFactoryService,
            ChallengeOutputIdFactoryService,
            ChallengePrerequisiteIdFactoryService,
            CourseParserService,
            ModuleParserService,
            ContentParserService,
            ChallengeParserService,
            FlashcardDeckParserService,
            PlaygroundParserService,
            PlaygroundStepParserService,
            MockInterviewParserService,
            PathResolverService,
            UpsertService,
            MilestoneIdFactoryService,
            MilestoneTaskIdFactoryService,
            MilestoneTaskPassCriteriaIdFactoryService,
            MilestoneTaskCodeImplementationIdFactoryService,
            MilestoneTaskBriefIdFactoryService,
            MilestoneTaskOutcomeCriteriaIdFactoryService,
            MilestoneTaskOutcomeCriteriaLangIdFactoryService,
            MilestoneTaskApproachCriteriaIdFactoryService,
            MilestoneTaskApproachCriteriaLangIdFactoryService,
            MilestonePathService,
            MilestoneTaskPathService,
            MilestoneParserService,
            MilestoneTaskParserService,
            UuidPartitionPersistProcessorService,
            ChallengeProcessorService,
            ContentProcessorService,
            ModuleProcessorService,
            FlashcardDeckProcessorService,
            PlaygroundProcessorService,
            MockInterviewProcessorService,
            MilestoneTaskProcessorService,
            MilestoneProcessorService,
            CourseProcessorService,
            CourseSeederService,
            AdvertisementSeederService,
            ChangelogSeederService,
            BlogSeederService,
            AchievementSeederService,
            InterviewQuestionEqPathService,
            InterviewQuestionEqIdFactoryService,
            InterviewQuestionEqParserService,
            MockInterviewEqSeederService,
            SeedersService,
            TemplateCvPathService,
            TemplateCvIdFactoryService,
            TemplateCvParserService,
            TemplateCvInsertService,
            CvSeederService,
            FoundationCategoryPathService,
            FoundationPathService,
            FoundationCategoryIdFactoryService,
            FoundationIdFactoryService,
            FoundationTagIdFactoryService,
            FoundationCategoryParserService,
            FoundationParserService,
            FoundationTagParserService,
            FoundationCategoryInsertService,
            FoundationInsertService,
            FoundationSeederService,
            HeadhuntingCompanyPathService,
            ConsultantPathService,
            HeadhuntingCompanyIdFactoryService,
            ConsultantIdFactoryService,
            HeadhuntingCompanyParserService,
            ConsultantParserService,
            HeadhuntingCompanyInsertService,
            ConsultantInsertService,
            HeadhuntingSeederService,
            AiModelCatalogPathService,
            SubscriptionCatalogPathService,
            AiModelCatalogParserService,
            SubscriptionCatalogParserService,
            AiModelInsertService,
            CatalogSeederService,
            CodingProblemPathService,
            CodingProblemParserService,
            CodingProblemInsertService,
            CodingProblemHintIndexService,
            CodingProblemSeederService,
        ]
        
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                ...providers,
            ],
            exports: providers,
        }
    }
}
