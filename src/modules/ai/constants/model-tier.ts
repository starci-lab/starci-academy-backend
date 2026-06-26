import {
    ModelProvider,
} from "@modules/databases"
import {
    AiTaskKind,
    ModelChoice,
    ModelRecommendation,
} from "../types"

/**
 * Per-task, per-tier model matrix.
 *
 * Each entry is an ordered fallback chain:
 * - Index 0 = primary choice
 * - Index 1+ = fallbacks if the primary provider is unavailable
 *
 * Note: this matrix feeds the UI "active model / fallback chain" display and
 * enqueue defaults via {@link AiTaskModelService}. The actual grading invoke is
 * driven by the balancer (category + catalog priority), so the free Auto lane
 * tries the self-hosted `local` Qwen first regardless — the chains below mirror
 * that order so the display matches reality.
 *
 *   low / medium → local Qwen (free) → economy cloud fallback
 *   high         → balanced cloud (deeper reasoning)
 *   CV high      → gemini-3.1-pro (flagship, long-context)
 */
const QWEN_LOCAL: ModelChoice = {
    model: "qwen2.5-coder:7b", provider: ModelProvider.Local
}

export const modelTierMatrix: Record<
    AiTaskKind,
    Record<ModelRecommendation, Array<ModelChoice>>
> = {
    /**
     * Grading: free Auto lane runs local Qwen first, then economy cloud.
     */
    [AiTaskKind.Grade]: {
        [ModelRecommendation.Low]: [
            QWEN_LOCAL,
            {
                model: "gpt-5.4-nano", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.5-flash-lite", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.Medium]: [
            QWEN_LOCAL,
            {
                model: "gpt-5.4-nano", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.5-flash-lite", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.High]: [
            {
                model: "gpt-5.4-mini", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-3.5-flash", provider: ModelProvider.Gemini
            },
        ],
    },

    /**
     * Milestone generation: creative planning task, cheaper models work well.
     */
    [AiTaskKind.GenerateMilestone]: {
        [ModelRecommendation.Low]: [
            {
                model: "gemini-2.5-flash-lite", provider: ModelProvider.Gemini
            },
            {
                model: "gpt-5.4-nano", provider: ModelProvider.OpenAI
            },
        ],
        [ModelRecommendation.Medium]: [
            {
                model: "gpt-5.4-nano", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.5-flash-lite", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.High]: [
            {
                model: "gpt-5.4-mini", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-3.5-flash", provider: ModelProvider.Gemini
            },
        ],
    },
    /**
     * Review personal project task: same free-Auto profile as challenge grading
     * (local Qwen first → economy cloud fallback).
     */
    [AiTaskKind.ReviewPersonalProject]: {
        [ModelRecommendation.Low]: [
            QWEN_LOCAL,
            {
                model: "gpt-5.4-nano", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.5-flash-lite", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.Medium]: [
            QWEN_LOCAL,
            {
                model: "gpt-5.4-nano", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-2.5-flash-lite", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.High]: [
            {
                model: "gpt-5.4-mini", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-3.5-flash", provider: ModelProvider.Gemini
            },
        ],
    },

    /**
     * CV review analyze: premium-only (no free Auto / no local Qwen). Long rubric
     * + markdown — medium/high use stronger cloud models.
     */
    [AiTaskKind.ReviewCvSubmission]: {
        [ModelRecommendation.Low]: [
            {
                model: "gemini-2.5-flash-lite", provider: ModelProvider.Gemini
            },
            {
                model: "gpt-5.4-nano", provider: ModelProvider.OpenAI
            },
        ],
        [ModelRecommendation.Medium]: [
            {
                model: "gpt-5.4-mini", provider: ModelProvider.OpenAI
            },
            {
                model: "gemini-3.5-flash", provider: ModelProvider.Gemini
            },
        ],
        [ModelRecommendation.High]: [
            {
                model: "gemini-3.1-pro", provider: ModelProvider.Gemini
            },
            {
                model: "gpt-5.4-mini", provider: ModelProvider.OpenAI
            },
        ],
    },
}
