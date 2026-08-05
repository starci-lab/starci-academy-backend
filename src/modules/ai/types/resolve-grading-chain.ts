import type {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"

/** Params for {@link resolveGradingChain}. */
export interface ResolveGradingChainParams {
    /** Category to start the climb from. */
    floor: AiModelCategory
    /** The user's entitled categories (plan ceiling). */
    tierCategories: Array<AiModelCategory>
    /** Optional user-set per-feature cap; can only lower the ceiling, never raise it. */
    ceil?: AiModelCategory | null
}
