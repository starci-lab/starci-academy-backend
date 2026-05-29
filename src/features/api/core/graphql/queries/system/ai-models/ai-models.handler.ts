import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    AiModelCatalogService,
    GradeModelRouterService,
    GenerateTaskModelRouterService,
    ReviewPersonalProjectModelRouterService,
    ReviewCvSubmissionModelRouterService,
    AiTaskKind,
    ModelRecommendation,
} from "@modules/ai"
import {
    modelTierMatrix,
} from "@modules/ai/constants"
import type {
    AiModelsResponseData,
    AiActiveModelData,
    AiGradableModelData,
} from "./graphql-types"

@Injectable()
export class AiModelsHandler {
    constructor(
        private readonly gradeRouter: GradeModelRouterService,
        private readonly generateTaskRouter: GenerateTaskModelRouterService,
        private readonly reviewRouter: ReviewPersonalProjectModelRouterService,
        private readonly reviewCvSubmissionRouter: ReviewCvSubmissionModelRouterService,
        private readonly modelCatalog: AiModelCatalogService,
    ) {}

    async execute(): Promise<AiModelsResponseData> {
        const tier = envConfig().ai.modelRecommendation as ModelRecommendation

        const models: Array<AiActiveModelData> = [
            {
                taskKind: AiTaskKind.Grade,
                label: "Chấm bài Challenge",
                description: "Chấm điểm các bài nộp code (Git, Google Docs). AI phân tích source code và đưa ra điểm số cùng phản hồi chi tiết.",
                activeModel: this.gradeRouter.current,
                fallbackChain: modelTierMatrix[AiTaskKind.Grade][tier] ?? [],
            },
            {
                taskKind: AiTaskKind.ReviewPersonalProject,
                label: "Review Dự án cá nhân",
                description: "Đánh giá task trong dự án cá nhân. AI kiểm tra từng tiêu chí và cho phản hồi từng phần.",
                activeModel: this.reviewRouter.current,
                fallbackChain: modelTierMatrix[AiTaskKind.ReviewPersonalProject][tier] ?? [],
            },
            {
                taskKind: AiTaskKind.GenerateMilestone,
                label: "Tạo Milestone & Task",
                description: "Sinh ra các milestone và task cho dự án cá nhân dựa trên ý tưởng và khóa học.",
                activeModel: this.generateTaskRouter.current,
                fallbackChain: modelTierMatrix[AiTaskKind.GenerateMilestone][tier] ?? [],
            },
            {
                taskKind: AiTaskKind.ReviewCvSubmission,
                label: "Review CV (analyze)",
                description: "Phân tích CV theo rubric, sinh markdown `detailFeedback` sau bước plan.",
                activeModel: this.reviewCvSubmissionRouter.current,
                fallbackChain: modelTierMatrix[AiTaskKind.ReviewCvSubmission][tier] ?? [],
            },
        ]

        // enabled rotation models the grading picker can offer (deduped by
        // provider+name); ordered by priority (highest first) from the catalog
        const enabled = await this.modelCatalog.enabledModels()
        const gradableModels: Array<AiGradableModelData> = enabled.map((model) => ({
            model: model.name,
            provider: model.provider,
            category: model.category,
            complimentary: model.complimentary,
        }))

        return {
            tier,
            models,
            gradableModels,
        }
    }
}
