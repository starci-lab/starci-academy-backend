import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    GradeModelRouterService,
    GenerateTaskModelRouterService,
    ReviewPersonalProjectModelRouterService,
    AiTaskKind,
    ModelRecommendation,
} from "@modules/ai"
import {
    modelTierMatrix,
} from "@modules/ai/model-tier"
import type {
    AiModelsResponseData,
    AiActiveModelData,
} from "./graphql-types"

@Injectable()
export class AiModelsHandler {
    constructor(
        private readonly gradeRouter: GradeModelRouterService,
        private readonly generateTaskRouter: GenerateTaskModelRouterService,
        private readonly reviewRouter: ReviewPersonalProjectModelRouterService,
    ) {}

    execute(): AiModelsResponseData {
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
        ]

        return {
            tier,
            models,
        }
    }
}
