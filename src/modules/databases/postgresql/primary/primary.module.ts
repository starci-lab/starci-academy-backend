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
    envConfig,
} from "@modules/platform/env/config"
import {
    POSTGRESQL_PRIMARY,
} from "./constants/connection"
import {
    InMemoryQueryResultCache,
} from "./cache/in-memory-query-result-cache"
import {
    AchievementEntity,
} from "./entities/achievement.entity"
import {
    ActivityReactionEntity,
} from "./entities/activity-reaction.entity"
import {
    ActivityEntity,
} from "./entities/activity.entity"
import {
    AdvertisementEntity,
} from "./entities/advertisement.entity"
import {
    AiModelTranslationEntity,
} from "./entities/ai-model-translation.entity"
import {
    AiModelEntity,
} from "./entities/ai-model.entity"
import {
    AiSubscriptionEntity,
} from "./entities/ai-subscription.entity"
import {
    BlogPostEntity,
} from "./entities/blog-post.entity"
import {
    CartItemEntity,
} from "./entities/cart-item.entity"
import {
    ChallengeOutputLangTranslationEntity,
} from "./entities/challenge-output-lang-translation.entity"
import {
    ChallengeOutputLangEntity,
} from "./entities/challenge-output-lang.entity"
import {
    ChallengeOutputEntity,
} from "./entities/challenge-output.entity"
import {
    ChallengePrerequisiteLangTranslationEntity,
} from "./entities/challenge-prerequisite-lang-translation.entity"
import {
    ChallengePrerequisiteLangEntity,
} from "./entities/challenge-prerequisite-lang.entity"
import {
    ChallengePrerequisiteEntity,
} from "./entities/challenge-prerequisite.entity"
import {
    ChallengeRequirementLangTranslationEntity,
} from "./entities/challenge-requirement-lang-translation.entity"
import {
    ChallengeRequirementLangEntity,
} from "./entities/challenge-requirement-lang.entity"
import {
    ChallengeRequirementEntity,
} from "./entities/challenge-requirement.entity"
import {
    ChallengeStepLangTranslationEntity,
} from "./entities/challenge-step-lang-translation.entity"
import {
    ChallengeStepLangEntity,
} from "./entities/challenge-step-lang.entity"
import {
    ChallengeStepEntity,
} from "./entities/challenge-step.entity"
import {
    ChallengeSubmissionApproachCriteriaLangEntity,
} from "./entities/challenge-submission-approach-criteria-lang.entity"
import {
    ChallengeSubmissionApproachCriteriaEntity,
} from "./entities/challenge-submission-approach-criteria.entity"
import {
    ChallengeSubmissionOutcomeCriteriaLangEntity,
} from "./entities/challenge-submission-outcome-criteria-lang.entity"
import {
    ChallengeSubmissionOutcomeCriteriaEntity,
} from "./entities/challenge-submission-outcome-criteria.entity"
import {
    ChallengeSubmissionPromptTranslationEntity,
} from "./entities/challenge-submission-prompt-translation.entity"
import {
    ChallengeSubmissionPromptEntity,
} from "./entities/challenge-submission-prompt.entity"
import {
    ChallengeSubmissionTranslationEntity,
} from "./entities/challenge-submission-translation.entity"
import {
    ChallengeSubmissionEntity,
} from "./entities/challenge-submission.entity"
import {
    ChallengeTranslationEntity,
} from "./entities/challenge-translation.entity"
import {
    ChallengeEntity,
} from "./entities/challenge.entity"
import {
    ChangelogEntryEntity,
} from "./entities/changelog-entry.entity"
import {
    ChatConversationEntity,
} from "./entities/chat-conversation.entity"
import {
    ChatMessageEntity,
} from "./entities/chat-message.entity"
import {
    CodeExplainingTranslationEntity,
} from "./entities/code-explaining-translation.entity"
import {
    CodeExplainingEntity,
} from "./entities/code-explaining.entity"
import {
    CodeImplementationTranslationEntity,
} from "./entities/code-implementation-translation.entity"
import {
    CodeImplementationEntity,
} from "./entities/code-implementation.entity"
import {
    CodingProblemSolutionEntity,
} from "./entities/coding-problem-solution.entity"
import {
    CodingProblemStarterCodeEntity,
} from "./entities/coding-problem-starter-code.entity"
import {
    CodingProblemTestcaseEntity,
} from "./entities/coding-problem-testcase.entity"
import {
    CodingProblemTranslationEntity,
} from "./entities/coding-problem-translation.entity"
import {
    CodingProblemEntity,
} from "./entities/coding-problem.entity"
import {
    CodingSolutionRevealEntity,
} from "./entities/coding-solution-reveal.entity"
import {
    CodingSubmissionEntity,
} from "./entities/coding-submission.entity"
import {
    CoinHistoryEntity,
} from "./entities/coin-history.entity"
import {
    CommentReactionEntity,
} from "./entities/comment-reaction.entity"
import {
    CommunityPostCommentReactionEntity,
} from "./entities/community-post-comment-reaction.entity"
import {
    CommunityPostCommentEntity,
} from "./entities/community-post-comment.entity"
import {
    CommunityPostReactionEntity,
} from "./entities/community-post-reaction.entity"
import {
    CommunityPostEntity,
} from "./entities/community-post.entity"
import {
    ConsultantTranslationEntity,
} from "./entities/consultant-translation.entity"
import {
    ConsultantEntity,
} from "./entities/consultant.entity"
import {
    ContentAiMessageEntity,
} from "./entities/content-ai-message.entity"
import {
    ContentAiSessionEntity,
} from "./entities/content-ai-session.entity"
import {
    ContentBodyTranslationEntity,
} from "./entities/content-body-translation.entity"
import {
    ContentBodyEntity,
} from "./entities/content-body.entity"
import {
    ContentCommentEntity,
} from "./entities/content-comment.entity"
import {
    ContentEngagementProjectionTranslationEntity,
} from "./entities/content-engagement-projection-translation.entity"
import {
    ContentEngagementProjectionEntity,
} from "./entities/content-engagement-projection.entity"
import {
    ContentLearningOutcomeTranslationEntity,
} from "./entities/content-learning-outcome-translation.entity"
import {
    ContentLearningOutcomeEntity,
} from "./entities/content-learning-outcome.entity"
import {
    ContentReactionEntity,
} from "./entities/content-reaction.entity"
import {
    ContentTranslationEntity,
} from "./entities/content-translation.entity"
import {
    ContentEntity,
} from "./entities/content.entity"
import {
    CourseMetadataEntity,
} from "./entities/course-metadata.entity"
import {
    CourseStatsProjectionTranslationEntity,
} from "./entities/course-stats-projection-translation.entity"
import {
    CourseStatsProjectionEntity,
} from "./entities/course-stats-projection.entity"
import {
    CourseTranslationEntity,
} from "./entities/course-translation.entity"
import {
    CourseVoucherEntity,
} from "./entities/course-voucher.entity"
import {
    CourseEntity,
} from "./entities/course.entity"
import {
    CreditUsageHistoryEntity,
} from "./entities/credit-usage-history.entity"
import {
    CvBlocksEntity,
} from "./entities/cv-blocks.entity"
import {
    DailyQuestCompletionEntity,
} from "./entities/daily-quest-completion.entity"
import {
    DeviceEntity,
} from "./entities/device.entity"
import {
    EnrollmentEntity,
} from "./entities/enrollment.entity"
import {
    FlashcardCardTranslationEntity,
} from "./entities/flashcard-card-translation.entity"
import {
    FlashcardCardEntity,
} from "./entities/flashcard-card.entity"
import {
    FlashcardDeckTranslationEntity,
} from "./entities/flashcard-deck-translation.entity"
import {
    FlashcardDeckEntity,
} from "./entities/flashcard-deck.entity"
import {
    FlashcardDueReviewSessionEntity,
} from "./entities/flashcard-due-review-session.entity"
import {
    FlashcardQuizSessionEntity,
} from "./entities/flashcard-quiz-session.entity"
import {
    FlashcardReviewEventEntity,
} from "./entities/flashcard-review-event.entity"
import {
    FlashcardReviewSessionEntity,
} from "./entities/flashcard-review-session.entity"
import {
    FoundationCategoryTranslationEntity,
} from "./entities/foundation-category-translation.entity"
import {
    FoundationCategoryEntity,
} from "./entities/foundation-category.entity"
import {
    FoundationTagTranslationEntity,
} from "./entities/foundation-tag-translation.entity"
import {
    FoundationTagEntity,
} from "./entities/foundation-tag.entity"
import {
    FoundationTranslationEntity,
} from "./entities/foundation-translation.entity"
import {
    FoundationEntity,
} from "./entities/foundation.entity"
import {
    HeadhuntingCompanyTranslationEntity,
} from "./entities/headhunting-company-translation.entity"
import {
    HeadhuntingCompanyEntity,
} from "./entities/headhunting-company.entity"
import {
    InstallmentPlanEntity,
} from "./entities/installment-plan.entity"
import {
    JobPostingEntity,
} from "./entities/job-posting.entity"
import {
    JobApplicationEntity,
} from "./entities/job-application.entity"
import {
    JobEntity,
} from "./entities/job.entity"
import {
    KpiWeeklyRewardFloorEntity,
} from "./entities/kpi-weekly-reward-floor.entity"
import {
    LeagueCohortPointsProjectionEntity,
} from "./entities/league-cohort-points-projection.entity"
import {
    LeagueCohortEntity,
} from "./entities/league-cohort.entity"
import {
    LivestreamSessionTranslationEntity,
} from "./entities/livestream-session-translation.entity"
import {
    LivestreamSessionEntity,
} from "./entities/livestream-session.entity"
import {
    LoginSessionEntity,
} from "./entities/login-session.entity"
import {
    MembershipEntity,
} from "./entities/membership.entity"
import {
    MilestoneTaskApproachCriteriaLangEntity,
} from "./entities/milestone-task-approach-criteria-lang.entity"
import {
    MilestoneTaskApproachCriteriaEntity,
} from "./entities/milestone-task-approach-criteria.entity"
import {
    MilestoneTaskBriefTranslationEntity,
} from "./entities/milestone-task-brief-translation.entity"
import {
    MilestoneTaskBriefEntity,
} from "./entities/milestone-task-brief.entity"
import {
    MilestoneTaskCodeImplementationTranslationEntity,
} from "./entities/milestone-task-code-implementation-translation.entity"
import {
    MilestoneTaskCodeImplementationEntity,
} from "./entities/milestone-task-code-implementation.entity"
import {
    MilestoneTaskCriteriaTranslationEntity,
} from "./entities/milestone-task-criteria-translation.entity"
import {
    MilestoneTaskCriteriaEntity,
} from "./entities/milestone-task-criteria.entity"
import {
    MilestoneTaskOutcomeCriteriaLangEntity,
} from "./entities/milestone-task-outcome-criteria-lang.entity"
import {
    MilestoneTaskOutcomeCriteriaEntity,
} from "./entities/milestone-task-outcome-criteria.entity"
import {
    MilestoneTaskTranslationEntity,
} from "./entities/milestone-task-translation.entity"
import {
    MilestoneTaskEntity,
} from "./entities/milestone-task.entity"
import {
    MilestoneTranslationEntity,
} from "./entities/milestone-translation.entity"
import {
    MilestoneEntity,
} from "./entities/milestone.entity"
import {
    MockInterviewAttemptEntity,
} from "./entities/mock-interview-attempt.entity"
import {
    MockInterviewChecklistEntity,
} from "./entities/mock-interview-checklist.entity"
import {
    MockInterviewLangTranslationEntity,
} from "./entities/mock-interview-lang-translation.entity"
import {
    MockInterviewLangEntity,
} from "./entities/mock-interview-lang.entity"
import {
    MockInterviewSessionEntity,
} from "./entities/mock-interview-session.entity"
import {
    MockInterviewTranslationEntity,
} from "./entities/mock-interview-translation.entity"
import {
    MockInterviewEntity,
} from "./entities/mock-interview.entity"
import {
    ModuleTranslationEntity,
} from "./entities/module-translation.entity"
import {
    ModuleEntity,
} from "./entities/module.entity"
import {
    NotificationEntity,
} from "./entities/notification.entity"
import {
    PlaygroundSessionEntity,
} from "./entities/playground-session.entity"
import {
    PlaygroundStepTranslationEntity,
} from "./entities/playground-step-translation.entity"
import {
    PlaygroundStepEntity,
} from "./entities/playground-step.entity"
import {
    PlaygroundTranslationEntity,
} from "./entities/playground-translation.entity"
import {
    PlaygroundEntity,
} from "./entities/playground.entity"
import {
    PrerequisiteTranslationEntity,
} from "./entities/prerequisite-translation.entity"
import {
    PrerequisiteEntity,
} from "./entities/prerequisite.entity"
import {
    PreviewContentTranslationEntity,
} from "./entities/preview-content-translation.entity"
import {
    PreviewContentEntity,
} from "./entities/preview-content.entity"
import {
    PricingPhaseEntity,
} from "./entities/pricing-phase.entity"
import {
    QnaTranslationEntity,
} from "./entities/qna-translation.entity"
import {
    QnaEntity,
} from "./entities/qna.entity"
import {
    RagPlaygroundSessionEntity,
} from "./entities/rag-playground-session.entity"
import {
    ResourceEntity,
} from "./entities/resource.entity"
import {
    RewardRedemptionEntity,
} from "./entities/reward-redemption.entity"
import {
    StreakProtectedDayEntity,
} from "./entities/streak-protected-day.entity"
import {
    SyncStateEntity,
} from "./entities/sync-state.entity"
import {
    TemplateCVTranslationEntity,
} from "./entities/template-cv-translation.entity"
import {
    TemplateCVEntity,
} from "./entities/template-cv.entity"
import {
    TransactionItemEntity,
} from "./entities/transaction-item.entity"
import {
    TransactionEntity,
} from "./entities/transaction.entity"
import {
    TrendingContentsProjectionEntity,
} from "./entities/trending-contents-projection.entity"
import {
    UserAchievementProjectionEntity,
} from "./entities/user-achievement-projection.entity"
import {
    UserAchievementEntity,
} from "./entities/user-achievement.entity"
import {
    UserCapstoneProjectionEntity,
} from "./entities/user-capstone-projection.entity"
import {
    UserChallengeProgressProjectionEntity,
} from "./entities/user-challenge-progress-projection.entity"
import {
    UserChallengeSubmissionAttemptEntity,
} from "./entities/user-challenge-submission-attempt.entity"
import {
    UserChallengeSubmissionFeedbackEntity,
} from "./entities/user-challenge-submission-feedback.entity"
import {
    UserChallengeSubmissionEntity,
} from "./entities/user-challenge-submission.entity"
import {
    UserCodingProjectionEntity,
} from "./entities/user-coding-projection.entity"
import {
    UserContentEntity,
} from "./entities/user-content.entity"
import {
    UserContributionProjectionEntity,
} from "./entities/user-contribution-projection.entity"
import {
    UserCourseProgressProjectionTranslationEntity,
} from "./entities/user-course-progress-projection-translation.entity"
import {
    UserCourseProgressProjectionEntity,
} from "./entities/user-course-progress-projection.entity"
import {
    UserCvGenerationEntity,
} from "./entities/user-cv-generation.entity"
import {
    UserFlashcardCourseStatsProjectionEntity,
} from "./entities/user-flashcard-course-stats-projection.entity"
import {
    UserFlashcardReviewEntity,
} from "./entities/user-flashcard-review.entity"
import {
    UserFlashcardStatsProjectionEntity,
} from "./entities/user-flashcard-stats-projection.entity"
import {
    UserFollowEntity,
} from "./entities/user-follow.entity"
import {
    UserLeagueEntity,
} from "./entities/user-league.entity"
import {
    UserMilestoneTaskAttemptFeedbackEntity,
} from "./entities/user-milestone-task-attempt-feedback.entity"
import {
    UserMilestoneTaskAttemptEntity,
} from "./entities/user-milestone-task-attempt.entity"
import {
    UserMilestoneTaskEntity,
} from "./entities/user-milestone-task.entity"
import {
    UserMockInterviewCourseStatsProjectionEntity,
} from "./entities/user-mock-interview-course-stats-projection.entity"
import {
    UserPinnedProjectEntity,
} from "./entities/user-pinned-project.entity"
import {
    UserPinnedProjectsProjectionEntity,
} from "./entities/user-pinned-projects-projection.entity"
import {
    UserSolvedChallengesProjectionEntity,
} from "./entities/user-solved-challenges-projection.entity"
import {
    UserStatsProjectionTranslationEntity,
} from "./entities/user-stats-projection-translation.entity"
import {
    UserStatsProjectionEntity,
} from "./entities/user-stats-projection.entity"
import {
    UserXpProjectionEntity,
} from "./entities/user-xp-projection.entity"
import {
    UserEntity,
} from "./entities/user.entity"
import {
    ValuePropositionTranslationEntity,
} from "./entities/value-proposition-translation.entity"
import {
    ValuePropositionEntity,
} from "./entities/value-proposition.entity"
import {
    WeeklyChallengeClaimEntity,
} from "./entities/weekly-challenge-claim.entity"
import {
    XpHistoryEntity,
} from "./entities/xp-history.entity"
import {
    ResolversModule,
} from "./resolvers/resolvers.module"
import {
    HydrationModule,
} from "./hydration/hydration.module"
import {
    SyncStateService
} from "./sync-state.service"
import {
    PostgreSqlAdvisoryLockService,
} from "./lock/postgresql-advisory-lock.service"

@Module({
})
/**
 * Primary PostgreSQL module for the primary PostgreSQL connection.
 */
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
                                    ContentTranslationEntity,
                                    CodeExplainingEntity,
                                    CodeExplainingTranslationEntity,
                                    CodeImplementationEntity,
                                    CodeImplementationTranslationEntity,
                                    ContentBodyEntity,
                                    ContentBodyTranslationEntity,
                                    ContentLearningOutcomeEntity,
                                    ContentLearningOutcomeTranslationEntity,
                                    ChallengeEntity,
                                    ChallengeTranslationEntity,
                                    ChallengeRequirementEntity,
                                    ChallengeRequirementLangEntity,
                                    ChallengeRequirementLangTranslationEntity,
                                    ChallengeStepEntity,
                                    ChallengeStepLangEntity,
                                    ChallengeStepLangTranslationEntity,
                                    ChallengeOutputEntity,
                                    ChallengeOutputLangEntity,
                                    ChallengeOutputLangTranslationEntity,
                                    ChallengePrerequisiteEntity,
                                    ChallengePrerequisiteLangEntity,
                                    ChallengePrerequisiteLangTranslationEntity,
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
                                    XpHistoryEntity,
                                    UserCvGenerationEntity,
                                    CvBlocksEntity,
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
                                    MilestoneTaskOutcomeCriteriaEntity,
                                    MilestoneTaskOutcomeCriteriaLangEntity,
                                    MilestoneTaskApproachCriteriaEntity,
                                    MilestoneTaskApproachCriteriaLangEntity,
                                    MilestoneTaskBriefEntity,
                                    MilestoneTaskBriefTranslationEntity,
                                    UserContentEntity,
                                    UserFollowEntity,
                                    ActivityEntity,
                                    UserCourseProgressProjectionEntity,
                                    UserCourseProgressProjectionTranslationEntity,
                                    UserChallengeProgressProjectionEntity,
                                    ContentEngagementProjectionEntity,
                                    ContentEngagementProjectionTranslationEntity,
                                    UserStatsProjectionEntity,
                                    UserStatsProjectionTranslationEntity,
                                    CourseStatsProjectionEntity,
                                    CourseStatsProjectionTranslationEntity,
                                    AdvertisementEntity,
                                    ChangelogEntryEntity,
                                    BlogPostEntity,
                                    LeagueCohortEntity,
                                    UserLeagueEntity,
                                    AchievementEntity,
                                    UserAchievementEntity,
                                    UserContributionProjectionEntity,
                                    UserAchievementProjectionEntity,
                                    UserCodingProjectionEntity,
                                    UserXpProjectionEntity,
                                    UserCapstoneProjectionEntity,
                                    UserPinnedProjectsProjectionEntity,
                                    UserSolvedChallengesProjectionEntity,
                                    TrendingContentsProjectionEntity,
                                    LeagueCohortPointsProjectionEntity,
                                    FlashcardReviewEventEntity,
                                    UserFlashcardStatsProjectionEntity,
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
                                    AiModelEntity,
                                    AiModelTranslationEntity,
                                    AiSubscriptionEntity,
                                    MembershipEntity,
                                    InstallmentPlanEntity,
                                    CodingProblemEntity,
                                    CodingProblemTranslationEntity,
                                    CodingProblemTestcaseEntity,
                                    CodingProblemStarterCodeEntity,
                                    CodingProblemSolutionEntity,
                                    CodingSolutionRevealEntity,
                                    CodingSubmissionEntity,
                                    DeviceEntity,
                                    LoginSessionEntity,
                                    FlashcardDeckEntity,
                                    FlashcardDeckTranslationEntity,
                                    FlashcardCardEntity,
                                    FlashcardCardTranslationEntity,
                                    UserFlashcardReviewEntity,
                                    MockInterviewAttemptEntity,
                                    MockInterviewSessionEntity,
                                    FlashcardQuizSessionEntity,
                                    FlashcardReviewSessionEntity,
                                    FlashcardDueReviewSessionEntity,
                                    UserFlashcardCourseStatsProjectionEntity,
                                    UserMockInterviewCourseStatsProjectionEntity,
                                    MockInterviewEntity,
                                    MockInterviewTranslationEntity,
                                    MockInterviewLangEntity,
                                    MockInterviewLangTranslationEntity,
                                    MockInterviewChecklistEntity,
                                    RagPlaygroundSessionEntity,
                                    StreakProtectedDayEntity,
                                    RewardRedemptionEntity,
                                    CourseVoucherEntity,
                                    DailyQuestCompletionEntity,
                                    KpiWeeklyRewardFloorEntity,
                                    WeeklyChallengeClaimEntity,
                                    CoinHistoryEntity,
                                    ContentReactionEntity,
                                    ContentAiSessionEntity,
                                    ContentAiMessageEntity,
                                    ActivityReactionEntity,
                                    ContentCommentEntity,
                                    CommentReactionEntity,
                                    CommunityPostEntity,
                                    CommunityPostCommentEntity,
                                    CommunityPostReactionEntity,
                                    CommunityPostCommentReactionEntity,
                                    ChatConversationEntity,
                                    ChatMessageEntity,
                                    NotificationEntity,
                                    UserPinnedProjectEntity,
                                    JobPostingEntity,
                                    JobApplicationEntity,
                                    CartItemEntity,
                                    TransactionItemEntity,
                                    PlaygroundEntity,
                                    PlaygroundTranslationEntity,
                                    PlaygroundStepEntity,
                                    PlaygroundStepTranslationEntity,
                                    PlaygroundSessionEntity,
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
                        ContentTranslationEntity,
                        CodeExplainingEntity,
                        CodeExplainingTranslationEntity,
                        CodeImplementationEntity,
                        CodeImplementationTranslationEntity,
                        ContentBodyEntity,
                        ContentBodyTranslationEntity,
                        ContentLearningOutcomeEntity,
                        ContentLearningOutcomeTranslationEntity,
                        ChallengeEntity,
                        ChallengeTranslationEntity,
                        ChallengeRequirementEntity,
                        ChallengeRequirementLangEntity,
                        ChallengeRequirementLangTranslationEntity,
                        ChallengeStepEntity,
                        ChallengeStepLangEntity,
                        ChallengeStepLangTranslationEntity,
                        ChallengeOutputEntity,
                        ChallengeOutputLangEntity,
                        ChallengeOutputLangTranslationEntity,
                        ChallengePrerequisiteEntity,
                        ChallengePrerequisiteLangEntity,
                        ChallengePrerequisiteLangTranslationEntity,
                        ChallengeSubmissionPromptEntity,
                        ChallengeSubmissionPromptTranslationEntity,
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
                        XpHistoryEntity,
                        UserCvGenerationEntity,
                        CvBlocksEntity,
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
                        MilestoneTaskOutcomeCriteriaEntity,
                        MilestoneTaskOutcomeCriteriaLangEntity,
                        MilestoneTaskApproachCriteriaEntity,
                        MilestoneTaskApproachCriteriaLangEntity,
                        MilestoneTaskBriefEntity,
                        MilestoneTaskBriefTranslationEntity,
                        UserContentEntity,
                        UserFollowEntity,
                        ActivityEntity,
                        UserCourseProgressProjectionEntity,
                        UserCourseProgressProjectionTranslationEntity,
                        UserChallengeProgressProjectionEntity,
                        ContentEngagementProjectionEntity,
                        ContentEngagementProjectionTranslationEntity,
                        UserStatsProjectionEntity,
                        UserStatsProjectionTranslationEntity,
                        CourseStatsProjectionEntity,
                        CourseStatsProjectionTranslationEntity,
                        AdvertisementEntity,
                        ChangelogEntryEntity,
                        BlogPostEntity,
                        LeagueCohortEntity,
                        UserLeagueEntity,
                        AchievementEntity,
                        UserAchievementEntity,
                        UserContributionProjectionEntity,
                        UserAchievementProjectionEntity,
                        UserCodingProjectionEntity,
                        UserXpProjectionEntity,
                        UserCapstoneProjectionEntity,
                        UserPinnedProjectsProjectionEntity,
                        UserSolvedChallengesProjectionEntity,
                        TrendingContentsProjectionEntity,
                        LeagueCohortPointsProjectionEntity,
                        FlashcardReviewEventEntity,
                        UserFlashcardStatsProjectionEntity,
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
                        AiModelEntity,
                        AiModelTranslationEntity,
                        AiSubscriptionEntity,
                        MembershipEntity,
                        InstallmentPlanEntity,
                        CodingProblemEntity,
                        CodingProblemTranslationEntity,
                        CodingProblemTestcaseEntity,
                        CodingProblemStarterCodeEntity,
                        CodingProblemSolutionEntity,
                        CodingSolutionRevealEntity,
                        CodingSubmissionEntity,
                        DeviceEntity,
                        LoginSessionEntity,
                        FlashcardDeckEntity,
                        FlashcardDeckTranslationEntity,
                        FlashcardCardEntity,
                        FlashcardCardTranslationEntity,
                        UserFlashcardReviewEntity,
                        MockInterviewAttemptEntity,
                        MockInterviewSessionEntity,
                        FlashcardQuizSessionEntity,
                        FlashcardReviewSessionEntity,
                        FlashcardDueReviewSessionEntity,
                        UserFlashcardCourseStatsProjectionEntity,
                        UserMockInterviewCourseStatsProjectionEntity,
                        MockInterviewEntity,
                        MockInterviewTranslationEntity,
                        MockInterviewLangEntity,
                        MockInterviewLangTranslationEntity,
                        MockInterviewChecklistEntity,
                        RagPlaygroundSessionEntity,
                        StreakProtectedDayEntity,
                        RewardRedemptionEntity,
                        CourseVoucherEntity,
                        DailyQuestCompletionEntity,
                        KpiWeeklyRewardFloorEntity,
                        WeeklyChallengeClaimEntity,
                        CoinHistoryEntity,
                        ContentReactionEntity,
                        ContentAiSessionEntity,
                        ContentAiMessageEntity,
                        ActivityReactionEntity,
                        ContentCommentEntity,
                        CommentReactionEntity,
                        CommunityPostEntity,
                        CommunityPostCommentEntity,
                        CommunityPostReactionEntity,
                        CommunityPostCommentReactionEntity,
                        ChatConversationEntity,
                        ChatMessageEntity,
                        UserPinnedProjectEntity,
                        JobPostingEntity,
                        JobApplicationEntity,
                        CartItemEntity,
                        TransactionItemEntity,
                        PlaygroundEntity,
                        PlaygroundTranslationEntity,
                        PlaygroundStepEntity,
                        PlaygroundStepTranslationEntity,
                        PlaygroundSessionEntity,
                    ],
                    POSTGRESQL_PRIMARY
                ),
            ]
        }
    }
}
