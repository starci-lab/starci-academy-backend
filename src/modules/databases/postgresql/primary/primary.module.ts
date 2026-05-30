import {
    DynamicModule, Module
} from "@nestjs/common"
import {
    TypeOrmModule as NestTypeOrmModule
} from "@nestjs/typeorm"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE
    } from "./primary.module-definition"
import {
    envConfig
} from "@modules/env"
import {
    POSTGRESQL_PRIMARY
} from "./constants"
import {
    InMemoryQueryResultCache
} from "./cache"
import {
    ContentEntity,
    ContentReferenceEntity,
    ContentReferenceTranslationEntity,
    ContentTranslationEntity,
    CodeExplainingEntity,
    CodeExplainingTranslationEntity,
    CodeImplementationEntity,
    CodeImplementationTranslationEntity,
    ContentBodyEntity,
    ContentBodyTranslationEntity,
    ChallengeEntity,
    ChallengeStepEntity,
    ChallengeStepTranslationEntity,
    ChallengeStepCodeImplementationEntity,
    ChallengeStepCodeImplementationTranslationEntity,
    ChallengeReferenceEntity,
    ChallengeReferenceTranslationEntity,
    ChallengeTranslationEntity,
    ChallengeRequirementEntity,
    ChallengeRequirementTranslationEntity,
    ChallengeOutputEntity,
    ChallengeOutputTranslationEntity,
    ChallengePrerequisiteEntity,
    ChallengePrerequisiteTranslationEntity,
    ChallengeRequirementV2Entity,
    ChallengeRequirementV2TranslationEntity,
    ChallengeRequirementV2LangEntity,
    ChallengeRequirementV2LangTranslationEntity,
    ChallengeStepV2Entity,
    ChallengeStepV2TranslationEntity,
    ChallengeStepV2LangEntity,
    ChallengeStepV2LangTranslationEntity,
    ChallengeOutputV2Entity,
    ChallengeOutputV2TranslationEntity,
    ChallengeOutputV2LangEntity,
    ChallengeOutputV2LangTranslationEntity,
    ChallengePrerequisiteV2Entity,
    ChallengePrerequisiteV2TranslationEntity,
    ChallengePrerequisiteV2LangEntity,
    ChallengePrerequisiteV2LangTranslationEntity,
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionPromptTranslationEntity,
    CourseEntity,
    CourseMetadataEntity,
    CourseTranslationEntity,
    PreviewContentEntity,
    PreviewContentTranslationEntity,
    PricingPhaseEntity,
    PrerequisiteEntity,
    PrerequisiteTranslationEntity,
    QnaEntity,
    QnaTranslationEntity,
    LivestreamSessionEntity,
    LivestreamSessionTranslationEntity,
    JobEntity,
    ModuleEntity,
    ModuleTranslationEntity,
    TransactionEntity,
    EnrollmentEntity,
    ResourceEntity,
    ChallengeSubmissionEntity,
    ChallengeSubmissionTranslationEntity,
    ChallengeSubmissionApproachCriteriaEntity,
    ChallengeSubmissionApproachCriteriaLangEntity,
    ChallengeSubmissionOutcomeCriteriaEntity,
    ChallengeSubmissionOutcomeCriteriaLangEntity,
    UserChallengeSubmissionEntity,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionFeedbackEntity,
    CreditUsageHistoryEntity,
    UserEntity,
    ValuePropositionEntity,
    ValuePropositionTranslationEntity,
    UserCVSubmissionEntity,
    UserCVSubmissionAttemptEntity,
    SyncStateEntity,
    UserMilestoneTaskEntity,
    UserMilestoneTaskAttemptEntity,
    UserMilestoneTaskAttemptFeedbackEntity,
    MilestoneEntity,
    MilestoneTranslationEntity,
    MilestoneTaskEntity,
    MilestoneTaskTranslationEntity,
    MilestoneTaskCriteriaEntity,
    MilestoneTaskCriteriaTranslationEntity,
    MilestoneTaskCodeImplementationEntity,
    MilestoneTaskCodeImplementationTranslationEntity,
    UserContentEntity,
    TemplateCVEntity,
    TemplateCVTranslationEntity,
    FoundationCategoryEntity,
    FoundationCategoryTranslationEntity,
    FoundationEntity,
    FoundationTranslationEntity,
    FoundationTagEntity,
    FoundationTagTranslationEntity,
    HeadhuntingCompanyEntity,
    HeadhuntingCompanyTranslationEntity,
    ConsultantEntity,
    ConsultantTranslationEntity,
    MindMapNodeEntity,
    MindMapNodeTranslationEntity,
    AiModelEntity,
    AiModelTranslationEntity,
    AiSubscriptionEntity,
    CodingProblemEntity,
    CodingProblemTranslationEntity,
    CodingProblemTestcaseEntity,
    CodingProblemStarterCodeEntity,
    CodingSubmissionEntity,
    QuizDeckEntity,
    QuizDeckTranslationEntity,
    QuizCardEntity,
    QuizCardTranslationEntity,
    QuizCardOptionEntity,
    QuizCardOptionTranslationEntity
    } from "./entities"
import {
    SeedersModule
} from "./seeders"
import {
    ResolversModule
    } from "./resolvers"
import {
    HydrationModule
    } from "./hydration"
import {
    SyncStateService
    } from "./sync-state.service"
import {
    PostgreSqlAdvisoryLockService
    } from "./lock"

/**
 * Primary PostgreSQL module for the primary PostgreSQL connection.
 */
@Module({
})
export class PrimaryPostgreSQLModule extends ConfigurableModuleClass {
    /**
     * Register.
     * @param options - Options.
     * @returns Dynamic module.
     */
    public static register(
        options: typeof OPTIONS_TYPE = {
        }
    ): DynamicModule {
        const dynamicModule = super.register(options)
        const extraModules: Array<DynamicModule> = []
        if (options.withHydration !== false) {
            extraModules.push(
                HydrationModule.register({
                    isGlobal: options.isGlobal
    }),
            )
        }
        if (options.withSeeders) {
            extraModules.push(
                SeedersModule.register(
                    {
                        ...options.withSeeders,
                        isGlobal: options.isGlobal
    }
                )
            )
        }
        if (options.withResolvers) {
            extraModules.push(
                ResolversModule.register({
                    isGlobal: options.isGlobal
    })
            )
        }
        return {
            ...dynamicModule,
            imports: [
                NestTypeOrmModule.forRootAsync(
                    {
                        name: POSTGRESQL_PRIMARY,
                        useFactory: async () => {
                            const {
                                database,
                                host,
                                password,
                                port,
                                username,
                                synchronize
    } = envConfig().databases.postgresql.primary
                            return {
                                type: "postgres",
                                host,
                                port,
                                username,
                                password,
                                database,
                                entities: [
                                    UserEntity,
                                    ValuePropositionEntity,
                                    ValuePropositionTranslationEntity,
                                    CourseEntity,
                                    CourseMetadataEntity,
                                    CourseTranslationEntity,
                                    PricingPhaseEntity,
                                    PrerequisiteEntity,
                                    PrerequisiteTranslationEntity,
                                    QnaEntity,
                                    QnaTranslationEntity,
                                    JobEntity,
                                    ModuleEntity,
                                    ModuleTranslationEntity,
                                    ContentEntity,
                                    ContentReferenceEntity,
                                    ContentReferenceTranslationEntity,
                                    ContentTranslationEntity,
                                    CodeExplainingEntity,
                                    CodeExplainingTranslationEntity,
                                    CodeImplementationEntity,
                                    CodeImplementationTranslationEntity,
                                    ContentBodyEntity,
                                    ContentBodyTranslationEntity,
                                    ChallengeEntity,
                                    ChallengeStepEntity,
                                    ChallengeStepTranslationEntity,
                                    ChallengeStepCodeImplementationEntity,
                                    ChallengeStepCodeImplementationTranslationEntity,
                                    ChallengeReferenceEntity,
                                    ChallengeReferenceTranslationEntity,
                                    ChallengeTranslationEntity,
                                    ChallengeRequirementEntity,
                                    ChallengeRequirementTranslationEntity,
                                    ChallengeOutputEntity,
                                    ChallengeOutputTranslationEntity,
                                    ChallengePrerequisiteEntity,
                                    ChallengePrerequisiteTranslationEntity,
                                    ChallengeRequirementV2Entity,
                                    ChallengeRequirementV2TranslationEntity,
                                    ChallengeRequirementV2LangEntity,
                                    ChallengeRequirementV2LangTranslationEntity,
                                    ChallengeStepV2Entity,
                                    ChallengeStepV2TranslationEntity,
                                    ChallengeStepV2LangEntity,
                                    ChallengeStepV2LangTranslationEntity,
                                    ChallengeOutputV2Entity,
                                    ChallengeOutputV2TranslationEntity,
                                    ChallengeOutputV2LangEntity,
                                    ChallengeOutputV2LangTranslationEntity,
                                    ChallengePrerequisiteV2Entity,
                                    ChallengePrerequisiteV2TranslationEntity,
                                    ChallengePrerequisiteV2LangEntity,
                                    ChallengePrerequisiteV2LangTranslationEntity,
                                    ChallengeSubmissionPromptEntity,
                                    ChallengeSubmissionPromptTranslationEntity,
                                    ChallengeSubmissionApproachCriteriaEntity,
                                    ChallengeSubmissionApproachCriteriaLangEntity,
                                    ChallengeSubmissionOutcomeCriteriaEntity,
                                    ChallengeSubmissionOutcomeCriteriaLangEntity,
                                    PreviewContentEntity,
                                    PreviewContentTranslationEntity,
                                    LivestreamSessionEntity,
                                    LivestreamSessionTranslationEntity,
                                    TransactionEntity,
                                    EnrollmentEntity,
                                    ResourceEntity,
                                    ChallengeSubmissionEntity,
                                    ChallengeSubmissionTranslationEntity,
                                    UserChallengeSubmissionEntity,
                                    UserChallengeSubmissionAttemptEntity,
                                    UserChallengeSubmissionFeedbackEntity,
                                    CreditUsageHistoryEntity,
                                    UserCVSubmissionEntity,
                                    UserCVSubmissionAttemptEntity,
                                    SyncStateEntity,
                                    UserMilestoneTaskEntity,
                                    UserMilestoneTaskAttemptEntity,
                                    UserMilestoneTaskAttemptFeedbackEntity,
                                    MilestoneEntity,
                                    MilestoneTranslationEntity,
                                    MilestoneTaskEntity,
                                    MilestoneTaskTranslationEntity,
                                    MilestoneTaskCriteriaEntity,
                                    MilestoneTaskCriteriaTranslationEntity,
                                    MilestoneTaskCodeImplementationEntity,
                                    MilestoneTaskCodeImplementationTranslationEntity,
                                    UserContentEntity,
                                    TemplateCVEntity,
                                    TemplateCVTranslationEntity,
                                    FoundationCategoryEntity,
                                    FoundationCategoryTranslationEntity,
                                    FoundationEntity,
                                    FoundationTranslationEntity,
                                    FoundationTagEntity,
                                    FoundationTagTranslationEntity,
                                    HeadhuntingCompanyEntity,
                                    HeadhuntingCompanyTranslationEntity,
                                    ConsultantEntity,
                                    ConsultantTranslationEntity,
                                    MindMapNodeEntity,
                                    MindMapNodeTranslationEntity,
                                    AiModelEntity,
                                    AiModelTranslationEntity,
                                    AiSubscriptionEntity,
                                    CodingProblemEntity,
                                    CodingProblemTranslationEntity,
                                    CodingProblemTestcaseEntity,
                                    CodingProblemStarterCodeEntity,
                                    CodingSubmissionEntity,
                                    QuizDeckEntity,
                                    QuizDeckTranslationEntity,
                                    QuizCardEntity,
                                    QuizCardTranslationEntity,
                                    QuizCardOptionEntity,
                                    QuizCardOptionTranslationEntity,
                                ],
                                synchronize,
                                logging: false,
                                cache: {
                                    provider(dataSource) {
                                        return new InMemoryQueryResultCache(dataSource)
                                    }
    }
    }
                        }
    }
                ),
                this.forFeature(),
                ...extraModules,
            ],
            providers: [
                SyncStateService,
                PostgreSqlAdvisoryLockService,
            ],
            exports: [
                ...extraModules,
                SyncStateService,
                PostgreSqlAdvisoryLockService,
            ]
    }
    }

    /**
     * For feature.
     * @param options - Options.
     * @returns Dynamic module.
     */
    private static forFeature(
    ): DynamicModule {
        return {
            module: PrimaryPostgreSQLModule,
            imports: [
                NestTypeOrmModule.forFeature(
                    [
                        UserEntity,
                        ValuePropositionEntity,
                        ValuePropositionTranslationEntity,
                        CourseEntity,
                        CourseMetadataEntity,
                        CourseTranslationEntity,
                        PricingPhaseEntity,
                        PrerequisiteEntity,
                        PrerequisiteTranslationEntity,
                        QnaEntity,
                        QnaTranslationEntity,
                        JobEntity,
                        ModuleEntity,
                        ModuleTranslationEntity,
                        ContentEntity,
                        ContentReferenceEntity,
                        ContentReferenceTranslationEntity,
                        ContentTranslationEntity,
                        CodeExplainingEntity,
                        CodeExplainingTranslationEntity,
                        CodeImplementationEntity,
                        CodeImplementationTranslationEntity,
                        ContentBodyEntity,
                        ContentBodyTranslationEntity,
                        ChallengeEntity,
                        ChallengeStepEntity,
                        ChallengeStepTranslationEntity,
                        ChallengeStepCodeImplementationEntity,
                        ChallengeStepCodeImplementationTranslationEntity,
                        ChallengeReferenceEntity,
                        ChallengeReferenceTranslationEntity,
                        ChallengeTranslationEntity,
                        ChallengeRequirementEntity,
                        ChallengeRequirementTranslationEntity,
                        ChallengeOutputEntity,
                        ChallengeOutputTranslationEntity,
                        ChallengePrerequisiteEntity,
                        ChallengePrerequisiteTranslationEntity,
                        ChallengeRequirementV2Entity,
                        ChallengeRequirementV2TranslationEntity,
                        ChallengeRequirementV2LangEntity,
                        ChallengeRequirementV2LangTranslationEntity,
                        ChallengeStepV2Entity,
                        ChallengeStepV2TranslationEntity,
                        ChallengeStepV2LangEntity,
                        ChallengeStepV2LangTranslationEntity,
                        ChallengeOutputV2Entity,
                        ChallengeOutputV2TranslationEntity,
                        ChallengeOutputV2LangEntity,
                        ChallengeOutputV2LangTranslationEntity,
                        ChallengePrerequisiteV2Entity,
                        ChallengePrerequisiteV2TranslationEntity,
                        ChallengePrerequisiteV2LangEntity,
                        ChallengePrerequisiteV2LangTranslationEntity,
                        ChallengeSubmissionPromptEntity,
                        ChallengeSubmissionPromptTranslationEntity,
                        PreviewContentEntity,
                        PreviewContentTranslationEntity,                        LivestreamSessionEntity,
                        LivestreamSessionTranslationEntity,
                        TransactionEntity,
                        EnrollmentEntity,
                        ResourceEntity,
                        ChallengeSubmissionEntity,
                        ChallengeSubmissionTranslationEntity,
                        UserChallengeSubmissionEntity,
                        UserChallengeSubmissionAttemptEntity,
                        UserChallengeSubmissionFeedbackEntity,
                        CreditUsageHistoryEntity,
                        UserCVSubmissionEntity,
                        UserCVSubmissionAttemptEntity,
                        SyncStateEntity,
                        UserMilestoneTaskEntity,
                        UserMilestoneTaskAttemptEntity,
                        UserMilestoneTaskAttemptFeedbackEntity,
                        MilestoneEntity,
                        MilestoneTranslationEntity,
                        MilestoneTaskEntity,
                        MilestoneTaskTranslationEntity,
                        MilestoneTaskCriteriaEntity,
                        MilestoneTaskCriteriaTranslationEntity,
                        MilestoneTaskCodeImplementationEntity,
                        MilestoneTaskCodeImplementationTranslationEntity,
                        UserContentEntity,
                        TemplateCVEntity,
                        TemplateCVTranslationEntity,
                        FoundationCategoryEntity,
                        FoundationCategoryTranslationEntity,
                        FoundationEntity,
                        FoundationTranslationEntity,
                        FoundationTagEntity,
                        FoundationTagTranslationEntity,
                        HeadhuntingCompanyEntity,
                        HeadhuntingCompanyTranslationEntity,
                        ConsultantEntity,
                        ConsultantTranslationEntity,
                        MindMapNodeEntity,
                        MindMapNodeTranslationEntity,
                        AiModelEntity,
                        AiModelTranslationEntity,
                        AiSubscriptionEntity,
                        CodingProblemEntity,
                        CodingProblemTranslationEntity,
                        CodingProblemTestcaseEntity,
                        CodingProblemStarterCodeEntity,
                        CodingSubmissionEntity,
                        QuizDeckEntity,
                        QuizDeckTranslationEntity,
                        QuizCardEntity,
                        QuizCardTranslationEntity,
                        QuizCardOptionEntity,
                        QuizCardOptionTranslationEntity,
                    ],
                    POSTGRESQL_PRIMARY
                ),
            ]
    }
    }
}
