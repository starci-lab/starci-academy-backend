import {
    DeepPartial,
} from "typeorm"
import {
    DayOfWeek,
    PricingPhase,
} from "../../../../enums"
import {
    PricingPhaseEntity,
} from "../../../../entities"

/** One pricing phase from course `# Course Data` JSON or root `data.json`. */
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

/** Course pricing, cover, and livestream config from `# Course Data` in `en.md` or `data.json`. */
export interface CourseDataJson {
    /** The original price of the course. */
    originalPrice: number
    /** The cover image URL of the course. */
    coverImageUrl: string
    /** The pricing phases of the course. */
    pricingPhases: Array<CoursePricingJson>
    /** The livestream sessions of the course. */
    livestreamSessions: Array<LivestreamSessionJson>
}

/** Ordinal of the course in the seed list (mount folder `{courseIndex}-{slug}`). */
export interface ParseCourseParams {
    courseIndex: number
}

/** One livestream session row from course structured data (markdown or `data.json`). */
export interface LivestreamSessionJson {
    /** Day of week for the livestream session. */
    dayOfWeek: DayOfWeek
    /** Start time of the livestream session. */
    startTime: string
    /** Expected end time of the livestream session. */
    expectedEndTime: string
    /** If true, this livestream session can be overridden by a newer override. */
    isOverridable?: boolean
    /** Display order within the livestream session list. */
    orderIndex: number
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