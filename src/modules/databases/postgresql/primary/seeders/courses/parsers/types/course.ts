import {
    DeepPartial,
} from "typeorm"
import {
    PricingPhase,
} from "../../../../enums"
import type {
    ExtractChallengeBlockBothParams,
    ExtractChallengeBlockBothResult,
} from "./challenge"
import {
    PricingPhaseEntity,
} from "../../../../entities"

/** Dual-locale markdown sections for course landing copy. */
export type ExtractCourseBlockBothParams = ExtractChallengeBlockBothParams

export type ExtractCourseBlockBothResult = ExtractChallengeBlockBothResult

/** Root `data.json` beside course `en.md` / `vi.md` (pricing tiers). */
export interface CourseDataJson {
    originalPrice: number
    currentPhase: string
    pricingPhases: Array<{
        phase: string
        price: number | null
        slotAvailable: number | null
        orderIndex: number
    }>
}

/** Ordinal of the course in the seed list (mount folder via `courseStorageDirName`). */
export interface ParseCourseParams {
    courseIndex: number
}

/** Course ordinals whose mount folders exist under `data/courses/`. */
export type ListCourseIndexesResult = Array<number>

/** Parsed pricing to merge onto {@link CourseEntity} (not stored on the course row). */
export interface ParsePricingResult {
    /** The original price of the course. */
    originalPrice: number
    /** The current phase of the course. */
    currentPhase: PricingPhase
    /** The pricing phases of the course. */
    pricingPhases: Array<DeepPartial<PricingPhaseEntity>>
}