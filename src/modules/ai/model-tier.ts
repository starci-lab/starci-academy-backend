import {
    ModelProvider,
} from "@modules/databases"
import {
    AiTaskKind,
    ModelChoice,
    ModelRecommendation,
} from "./types"

/**
 * Per-task, per-tier model matrix.
 *
 * Each entry is an ordered fallback chain:
 * - Index 0 = primary choice
 * - Index 1 = fallback if the primary provider is unavailable
 *
 * Optimised for cost:
 *   low    → Gemini Flash (free-tier friendly) → OpenAI mini fallback
 *   medium → OpenAI mini (grading) / Gemini Flash (milestone) → fallback
 *   high   → OpenAI 4o (grading) / OpenAI mini (milestone) → fallback
 */
export const modelTierMatrix: Record<
    AiTaskKind,
    Record<ModelRecommendation, Array<ModelChoice>>
> = {
    /**
     * Grading: precision matters, larger models are better.
     */
    [AiTaskKind.Grade]: {
        [ModelRecommendation.Low]: [
            {
                model: "gpt-4o-mini", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.0-flash", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.Medium]: [
            {
                model: "gpt-4o-mini", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.0-flash", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.High]: [
            {
                model: "gpt-4o", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.0-flash", provider: ModelProvider.Gemini
            },
        ],
    },

    /**
     * Milestone generation: creative planning task, cheaper models work well.
     */
    [AiTaskKind.GenerateMilestone]: {
        [ModelRecommendation.Low]: [
            {
                model: "gemini-2.0-flash", provider: ModelProvider.Gemini
            },
            {
                model: "gpt-4o-mini", provider: ModelProvider.OpenAI
            },
        ],
        [ModelRecommendation.Medium]: [
            {
                model: "gpt-4o-mini", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.0-flash", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.High]: [
            {
                model: "gpt-4o", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.0-flash", provider: ModelProvider.Gemini
            },
        ],
    },
    /**
     * Review personal project task: same grading profile as challenge grading.
     */
    [AiTaskKind.ReviewPersonalProject]: {
        [ModelRecommendation.Low]: [
            {
                model: "gpt-4o-mini", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.0-flash", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.Medium]: [
            {
                model: "gpt-4o-mini", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.0-flash", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.High]: [
            {
                model: "gpt-4o", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.0-flash", provider: ModelProvider.Gemini
            },
        ],
    },
}
