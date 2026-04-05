import type {
    DeepPartial,
} from "typeorm"
import type {
    ModuleEntity,
    PricingPhaseEntity,
} from "../../../../entities"
import type {
    PricingPhase,
} from "../../../../enums"
import type {
    ExtractChallengeBlockBothParams,
    ExtractChallengeBlockBothResult,
} from "./challenge"

/** Dual-locale markdown sections for module landing copy. */
export type ExtractModuleBlockBothParams = ExtractChallengeBlockBothParams

export type ExtractModuleBlockBothResult = ExtractChallengeBlockBothResult

/** Identifies a module folder under `courses/{alias}/modules/{moduleIndex}/`. */
export interface ParseModuleParams {
    courseIndex: number
    moduleIndex: number
}

/** Params for listing `modules/{n}/` folder indices on the mount. */
export interface ModuleIndexesParams {
    courseIndex: number
}

/** Sorted `moduleIndex` values under `courses/{alias}/modules/`. */
export type ListModuleIndexesResult = Array<number>

/** One tier row inside module `data.json` (mirrors course pricing phases). */
export interface ModuleDataJsonPricingPhaseRow {
    phase: string
    price: number | null
    slotAvailable: number | null
    orderIndex: number
}

/** Course-level pricing block sometimes stored in module `data.json`. */
export interface ModuleDataJson {
    displayId: string
}

/** Parsed pricing to merge onto {@link CourseEntity} (not stored on the module row). */
export interface ParseModuleCoursePricingResult {
    originalPrice: number
    currentPhase: PricingPhase
    pricingPhases: Array<
        DeepPartial<PricingPhaseEntity> & {
            id: string
            phase: PricingPhase
            orderIndex: number
            price?: number | null
            slotAvailable?: number | null
        }
    >
}

/** Module graph plus optional course pricing from the same `data.json`. */
export interface ParseModuleResult {
    module: DeepPartial<ModuleEntity>
    coursePricing?: ParseModuleCoursePricingResult
}