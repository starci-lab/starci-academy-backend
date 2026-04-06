import {
    DeepPartial,
} from "typeorm"
import {
    PricingPhase,
} from "../../../../enums"
import {
    PricingPhaseEntity,
} from "../../../../entities"

/** Root `data.json` beside course `en.md` / `vi.md` (pricing tiers). */
export interface CoursePricingJson {
    /** The phase of the pricing. */
    phase: string
    /** The price of the pricing. */
    price?: number
    /** The slot available of the pricing. */
    slotAvailable?: number
    /** The order index of the pricing. */
    orderIndex: number
}
export interface CourseDataJson {
    /** The original price of the course. */
    originalPrice: number
    /** The cover image URL of the course. */
    coverImageUrl: string
    /** The pricing phases of the course. */
    pricingPhases: Array<CoursePricingJson>
}

/** Ordinal of the course in the seed list (mount folder `{courseIndex}-{slug}`). */
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