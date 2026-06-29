import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    AiModelCategory,
} from "@modules/databases"
import {
    AiModelCatalogService,
    AiTaskModelService,
    AiTaskKind,
    ModelRecommendation,
    UseApiService,
} from "@modules/ai"
import type {
    AiModelsResponseData,
    AiActiveModelData,
    AiGradableModelData,
} from "./graphql-types"

@Injectable()
export class AiModelsHandler {
    constructor(
        private readonly aiTaskModelService: AiTaskModelService,
        private readonly modelCatalog: AiModelCatalogService,
        private readonly useApiService: UseApiService,
    ) {}

    async execute(): Promise<AiModelsResponseData> {
        const tier = envConfig().ai.modelRecommendation as ModelRecommendation

        const models: Array<AiActiveModelData> = [
            {
                taskKind: AiTaskKind.Grade,
                label: "Chấm bài Challenge",
                description: "Chấm điểm các bài nộp code (Git, Google Docs). AI phân tích source code và đưa ra điểm số cùng phản hồi chi tiết.",
                activeModel: this.aiTaskModelService.primaryChoice(AiTaskKind.Grade),
                fallbackChain: this.aiTaskModelService.fallbackChain(AiTaskKind.Grade),
            },
            {
                taskKind: AiTaskKind.ReviewPersonalProject,
                label: "Review Dự án cá nhân",
                description: "Đánh giá task trong dự án cá nhân. AI kiểm tra từng tiêu chí và cho phản hồi từng phần.",
                activeModel: this.aiTaskModelService.primaryChoice(AiTaskKind.ReviewPersonalProject),
                fallbackChain: this.aiTaskModelService.fallbackChain(AiTaskKind.ReviewPersonalProject),
            },
            {
                taskKind: AiTaskKind.ReviewCvSubmission,
                label: "Review CV (analyze)",
                description: "Phân tích CV theo rubric, sinh markdown `detailFeedback` sau bước plan.",
                activeModel: this.aiTaskModelService.primaryChoice(AiTaskKind.ReviewCvSubmission),
                fallbackChain: this.aiTaskModelService.fallbackChain(AiTaskKind.ReviewCvSubmission),
            },
        ]

        const enabled = await this.modelCatalog.enabledModels()
        // providers whose key pool still has a healthy key — a model whose
        // provider is missing here is rendered locked in the picker (no key)
        const usableProviders = await this.useApiService.availableProviders()
        // grading runs on Economy and up — exclude Free models (they back the
        // free chatbot, not grading) so the grade-model picker never lists them
        const gradableModels: Array<AiGradableModelData> = enabled
            .filter((model) => model.category !== AiModelCategory.Free)
            .map((model) => ({
                model: model.name,
                provider: model.provider,
                category: model.category,
                complimentary: model.complimentary,
                available: usableProviders.has(model.provider),
            }))

        return {
            tier,
            models,
            gradableModels,
        }
    }
}
