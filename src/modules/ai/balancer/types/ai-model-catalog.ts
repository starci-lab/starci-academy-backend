import type {
    AiModelCategory,
} from "@modules/databases"

/** Params for {@link AiModelCatalogService.enabledModels}. */
export interface EnabledModelsParams {
    /** Optional category filter — restricts to one cost/quality tier. */
    category?: AiModelCategory
}
