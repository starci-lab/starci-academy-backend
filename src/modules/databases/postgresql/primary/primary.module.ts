import {
    DynamicModule, Module
} from "@nestjs/common"
import {
    TypeOrmModule as NestTypeOrmModule
} from "@nestjs/typeorm"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./primary.module-definition"
import {
    envConfig
} from "@modules/env"
import {
    POSTGRESQL_PRIMARY
} from "./constants"
import {
    ContentEntity,
    ContentReferenceEntity,
    ContentReferenceTranslationEntity,
    ContentTranslationEntity,
    CodeExplainingEntity,
    CodeExplainingTranslationEntity,
    CodeImplementationEntity,
    CodeImplementationTranslationEntity,
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
    LessonVideoEntity,
    LessonVideoTranslationEntity,
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
    UserChallengeSubmissionEntity,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionFeedbackEntity,
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
} from "./entities"
import {
    SeedersModule
} from "./seeders"
import {
    ResolversModule,
} from "./resolvers"
import {
    HydrationModule,
} from "./hydration"
import {
    SyncStateService,
} from "./sync-state.service"
import {
    PostgreSqlAdvisoryLockService,
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
                    isGlobal: options.isGlobal,
                }),
            )
        }
        if (options.withSeeders) {
            extraModules.push(
                SeedersModule.register(
                    {
                        ...options.withSeeders,
                        isGlobal: options.isGlobal,
                    }
                )
            )
        }
        if (options.withResolvers) {
            extraModules.push(
                ResolversModule.register({
                    isGlobal: options.isGlobal,
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
                                synchronize,
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
                                    ChallengeSubmissionPromptEntity,
                                    ChallengeSubmissionPromptTranslationEntity,
                                    PreviewContentEntity,
                                    PreviewContentTranslationEntity,
                                    LessonVideoEntity,
                                    LessonVideoTranslationEntity,
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
                                ],
                                synchronize,
                                logging: false,
                            }
                        },
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
            ],
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
                        ChallengeSubmissionPromptEntity,
                        ChallengeSubmissionPromptTranslationEntity,
                        PreviewContentEntity,
                        PreviewContentTranslationEntity,
                        LessonVideoEntity,
                        LessonVideoTranslationEntity,
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
                    ],
                    POSTGRESQL_PRIMARY
                ),
            ],
        }
    }
}
