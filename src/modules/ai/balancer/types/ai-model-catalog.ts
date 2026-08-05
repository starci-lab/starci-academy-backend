import type {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"

/** Params for {@link AiModelCatalogService.enabledModels}. */
export interface EnabledModelsParams {
    /** Optional category filter -- restricts to one cost/quality tier. */
    category?: AiModelCategory
}

/** Params for {@link AiModelCatalogService.creditForRun}. */
export interface CreditForRunParams {
    /** The served model's catalog name. */
    name: string
    /** Prompt (input) tokens the provider reported. */
    promptTokens?: number
    /** Completion (output) tokens the provider reported. */
    completionTokens?: number
    /** Prompt-cache HIT tokens, already counted inside {@link promptTokens}. */
    cachedTokens?: number
    /** Credit to charge when the model is unknown/disabled or reported no usage. */
    fallback: number
}
