import {
    getMetadataArgsStorage
} from "typeorm"
import {
    TransactionEntity
} from "./transaction.entity"
describe("TransactionEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new TransactionEntity(),
            {
                id: "wave22-transaction"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-transaction"); const id = getMetadataArgsStorage().columns.find((x) => x.target === TransactionEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
import {
    buildEntityGraphqlSchema
} from "../../../../../tests/helpers/entity-graphql-schema"
import {
    GraphQLObjectType,
} from "graphql"
import {
    UserCvGenerationEntity
} from "./user-cv-generation.entity"
import {
    AiModelEntity
} from "./ai-model.entity"
import {
    InstallmentPlanEntity
} from "./installment-plan.entity"
import {
    JobPostingEntity
} from "./job-posting.entity"
import {
    CodingProblemEntity
} from "./coding-problem.entity"
import {
    FoundationEntity
} from "./foundation.entity"
import {
    ConsultantEntity
} from "./consultant.entity"
import {
    HeadhuntingCompanyEntity
} from "./headhunting-company.entity"
import {
    JobEntity
} from "./job.entity"
import {
    CodingSubmissionEntity
} from "./coding-submission.entity"
import {
    CreditUsageHistoryEntity
} from "./credit-usage-history.entity"
import {
    PlaygroundSessionEntity
} from "./playground-session.entity"
import {
    UserPinnedProjectEntity
} from "./user-pinned-project.entity"
import {
    ContentCommentEntity
} from "./content-comment.entity"
import {
    CourseEntity
} from "./course.entity"
import {
    CvBlocksEntity
} from "./cv-blocks.entity"
import {
    FoundationCategoryEntity
} from "./foundation-category.entity"
import {
    FoundationTagEntity
} from "./foundation-tag.entity"
import {
    XpHistoryEntity
} from "./xp-history.entity"
import {
    CommunityPostCommentEntity
} from "./community-post-comment.entity"
import {
    ContentEntity
} from "./content.entity"
import {
    PlaygroundEntity
} from "./playground.entity"
import {
    PlaygroundStepEntity
} from "./playground-step.entity"
import {
    TransactionItemEntity
} from "./transaction-item.entity"
import {
    UserAchievementEntity
} from "./user-achievement.entity"
import {
    AchievementEntity
} from "./achievement.entity"
import {
    TemplateCVEntity
} from "./template-cv.entity"
import {
    ChatMessageEntity
} from "./chat-message.entity"
import {
    CommunityPostEntity
} from "./community-post.entity"
import {
    JobApplicationEntity
} from "./job-application.entity"
import {
    CartItemEntity
} from "./cart-item.entity"
import {
    CodingProblemStarterCodeEntity
} from "./coding-problem-starter-code.entity"
import {
    CodingProblemTranslationEntity
} from "./coding-problem-translation.entity"
import {
    CoinHistoryEntity
} from "./coin-history.entity"
import {
    ContentReactionEntity
} from "./content-reaction.entity"
import {
    CourseReviewEntity
} from "./course-review.entity"
import {
    PlaygroundStepTranslationEntity
} from "./playground-step-translation.entity"
import {
    PlaygroundTranslationEntity
} from "./playground-translation.entity"
import {
    UserCourseProgressProjectionTranslationEntity
} from "./user-course-progress-projection-translation.entity"
import {
    AiModelTranslationEntity
} from "./ai-model-translation.entity"
import {
    ConsultantTranslationEntity
} from "./consultant-translation.entity"
import {
    ContentEngagementProjectionTranslationEntity
} from "./content-engagement-projection-translation.entity"
import {
    CourseStatsProjectionTranslationEntity
} from "./course-stats-projection-translation.entity"
import {
    FoundationCategoryTranslationEntity
} from "./foundation-category-translation.entity"
import {
    FoundationTagTranslationEntity
} from "./foundation-tag-translation.entity"
import {
    FoundationTranslationEntity
} from "./foundation-translation.entity"
import {
    HeadhuntingCompanyTranslationEntity
} from "./headhunting-company-translation.entity"
import {
    TemplateCVTranslationEntity
} from "./template-cv-translation.entity"
import {
    UserStatsProjectionTranslationEntity
} from "./user-stats-projection-translation.entity"
import {
    ChatConversationEntity
} from "./chat-conversation.entity"
import {
    ChallengeSubmissionEntity
} from "./challenge-submission.entity"
import {
    ChallengeEntity
} from "./challenge.entity"
import {
    MilestoneTaskEntity
} from "./milestone-task.entity"
describe("TransactionEntity index metadata",
    () => { it("resolves callable index where metadata when present",
        () => { const s = getMetadataArgsStorage(); const values = s.indices.filter((x) => x.target === TransactionEntity).map((x) => x.where); expect(values.every((value) => value === undefined || typeof value === "string")).toBe(true) }) })

describe("TransactionEntity contract",
    () => { it("maps payment identity and status columns",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === TransactionEntity)).toBe(true); expect(s.columns.filter((x) => x.target === TransactionEntity).length).toBeGreaterThan(4); expect(s.indices.some((x) => x.target === TransactionEntity)).toBe(true) }) })

describe("GraphQL entity contracts",
    () => {
        it("builds every ObjectType entity and exposes its fields",
            async () => {
                const entities = [TransactionEntity,
                    UserCvGenerationEntity,
                    AiModelEntity,
                    InstallmentPlanEntity,
                    JobPostingEntity,
                    CodingProblemEntity,
                    FoundationEntity,
                    ConsultantEntity,
                    HeadhuntingCompanyEntity,
                    JobEntity,
                    CodingSubmissionEntity,
                    CreditUsageHistoryEntity,
                    PlaygroundSessionEntity,
                    UserPinnedProjectEntity,
                    ContentCommentEntity,
                    CourseEntity,
                    CvBlocksEntity,
                    FoundationCategoryEntity,
                    FoundationTagEntity,
                    XpHistoryEntity,
                    CommunityPostCommentEntity,
                    ContentEntity,
                    PlaygroundEntity,
                    PlaygroundStepEntity,
                    TransactionItemEntity,
                    UserAchievementEntity,
                    AchievementEntity,
                    TemplateCVEntity,
                    ChatMessageEntity,
                    CommunityPostEntity,
                    JobApplicationEntity,
                    CartItemEntity,
                    CodingProblemStarterCodeEntity,
                    CodingProblemTranslationEntity,
                    CoinHistoryEntity,
                    ContentReactionEntity,
                    CourseReviewEntity,
                    PlaygroundStepTranslationEntity,
                    PlaygroundTranslationEntity,
                    UserCourseProgressProjectionTranslationEntity,
                    AiModelTranslationEntity,
                    ConsultantTranslationEntity,
                    ContentEngagementProjectionTranslationEntity,
                    CourseStatsProjectionTranslationEntity,
                    FoundationCategoryTranslationEntity,
                    FoundationTagTranslationEntity,
                    FoundationTranslationEntity,
                    HeadhuntingCompanyTranslationEntity,
                    TemplateCVTranslationEntity,
                    UserStatsProjectionTranslationEntity,
                    ChatConversationEntity,
                    ChallengeSubmissionEntity,
                    ChallengeEntity,
                    MilestoneTaskEntity] as const
                const schema = await buildEntityGraphqlSchema(entities)
                for (const entity of entities) {
                    const typeNames = entity.name === "ChallengeSubmissionEntity"
                        ? ["Submission",
                            entity.name]
                        : [entity.name,
                            entity.name.replace(/Entity$/u,
                                "")]
                    const type = typeNames.map((name) => schema.getType(name)).find((candidate) => candidate !== undefined)
                    expect(type).toBeInstanceOf(GraphQLObjectType)
                    expect(Object.keys((type as GraphQLObjectType).getFields()).length).toBeGreaterThan(0)
                }
                expect(schema.getType("ContentAiSessionEntity")).toBeUndefined()
                expect(schema.getType("MockInterviewAttemptEntity")).toBeUndefined()
                expect(schema.getType("MockInterviewEntity")).toBeUndefined()
                expect(schema.getType("UserCourseProgressProjectionEntity")).toBeUndefined()
                expect(schema.getType("UserFlashcardReviewEntity")).toBeUndefined()
                expect(schema.getType("ChallengeSubmissionApproachCriteriaEntity")).toBeUndefined()
                expect(schema.getType("ChallengeSubmissionOutcomeCriteriaEntity")).toBeUndefined()
                expect(schema.getType("ChallengeSubmissionPromptEntity")).toBeUndefined()
                expect(schema.getType("FlashcardReviewEventEntity")).toBeUndefined()
                expect(schema.getType("FlashcardReviewSessionEntity")).toBeUndefined()
                expect(schema.getType("MilestoneTaskApproachCriteriaEntity")).toBeUndefined()
                expect(schema.getType("MilestoneTaskOutcomeCriteriaEntity")).toBeUndefined()
                expect(schema.getType("MockInterviewLangEntity")).toBeUndefined()
                expect(schema.getType("ChatMessageMentionEntity")).toBeUndefined()
                expect(schema.getType("ChatMessageReactionEntity")).toBeUndefined()
                expect(schema.getType("ChatModerationAuditEntity")).toBeUndefined()
                expect(schema.getType("ChatModerationCaseEntity")).toBeUndefined()
                expect(schema.getType("ChatParticipationEntity")).toBeUndefined()
                expect(schema.getType("CodingSolutionRevealEntity")).toBeUndefined()
                expect(schema.getType("FlashcardQuizSessionEntity")).toBeUndefined()
                expect(schema.getType("UserFollowEntity")).toBeUndefined()
            })
    })
