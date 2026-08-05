import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
import {
    UseApiService,
} from "@modules/ai/balancer/use-api.service"
import {
    AiTaskKind,
    ModelRecommendation,
} from "@modules/ai/types/model"
import {
    GRADING_FLOOR_CATEGORY,
} from "@modules/ai/utils/resolve-grading-chain"
import {
    AiModelTask,
} from "@modules/databases"
import type {
    AiModelsResponseData,
    AiActiveModelData,
    AiGradableModelData,
    AiModelChoiceData,
} from "./graphql-types"

@Injectable()
/**
 * Builds the live AI roster for the admin/picker panel: derives each grading
 * task's active model + fallback chain from the enabled catalog (so the UI
 * never advertises a model the balancer cannot reach), and flags which
 * gradable models still have a healthy provider key.
 */
export class AiModelsHandler {
    constructor(
        private readonly modelCatalog: AiModelCatalogService,
        private readonly useApiService: UseApiService,
    ) {}

    async execute(): Promise<AiModelsResponseData> {
        const tier = envConfig().ai.modelRecommendation as ModelRecommendation

        const enabled = await this.modelCatalog.enabledModels()

        // Read the chain the balancer will ACTUALLY run, rather than a static
        // per-task table maintained beside the catalog. That table drifted: it
        // went on advertising models the roster no longer contains, so the panel
        // showed an admin a model that could not be reached.
        //
        // Every grading task now resolves to the same category -- difficulty no
        // longer selects a rung -- so the three rows below share one chain, and
        // it is derived, never typed.
        const gradingChain: Array<AiModelChoiceData> = enabled
            .filter((model) => model.category === GRADING_FLOOR_CATEGORY)
            .filter((model) => !model.supportedTasks?.length
                || model.supportedTasks.includes(AiModelTask.Grading))
            // highest weight first -- the order UseApiService tries them in
            .sort((left, right) => right.weight - left.weight)
            .map((model) => ({
                model: model.name,
                provider: model.provider,
            }))

        const models: Array<AiActiveModelData> = [
            {
                taskKind: AiTaskKind.Grade,
                label: "Chấm bài Challenge", // vn-ok: vi-locale catalog label emitted to clients
                description: "Chấm điểm các bài nộp code (Git, Google Docs). AI phân tích source code và đưa ra điểm số cùng phản hồi chi tiết.", // vn-ok: vi-locale catalog description emitted to clients
                activeModel: gradingChain[0],
                fallbackChain: gradingChain,
            },
            {
                taskKind: AiTaskKind.ReviewPersonalProject,
                label: "Review Dự án cá nhân", // vn-ok: vi-locale catalog label emitted to clients
                description: "Đánh giá task trong dự án cá nhân. AI kiểm tra từng tiêu chí và cho phản hồi từng phần.", // vn-ok: vi-locale catalog description emitted to clients
                activeModel: gradingChain[0],
                fallbackChain: gradingChain,
            },
            {
                taskKind: AiTaskKind.ReviewCvSubmission,
                label: "Review CV (analyze)",
                description: "Phân tích CV theo rubric, sinh markdown `detailFeedback` sau bước plan.", // vn-ok: vi-locale catalog description emitted to clients
                activeModel: gradingChain[0],
                fallbackChain: gradingChain,
            },
        ]
        // providers whose key pool still has a healthy key -- a model whose
        // provider is missing here is rendered locked in the picker (no key)
        const usableProviders = await this.useApiService.availableProviders()
        // EVERY enabled model -- incl. Free: the picker shows Free flagged DANGER
        // (may return inaccurate grades), not hidden, so a learner can still pick
        // one at their own risk. Frontier + paid tiers gate on entitlement (FE).
        const gradableModels: Array<AiGradableModelData> = enabled
            .map((model) => ({
                model: model.name,
                provider: model.provider,
                category: model.category,
                complimentary: model.complimentary,
                available: usableProviders.has(model.provider),
                supportedTasks: model.supportedTasks,
            }))

        return {
            tier,
            models,
            gradableModels,
        }
    }
}
