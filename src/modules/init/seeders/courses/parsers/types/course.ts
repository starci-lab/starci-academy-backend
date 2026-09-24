import {
    DeepPartial,
} from "typeorm"
import {
    DayOfWeek,
} from "@modules/databases/postgresql/primary/enums/day-of-week"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    PricingPhaseEntity,
} from "@modules/databases/postgresql/primary/entities/pricing-phase.entity"
import {
    ResolvedFilePath,
} from "../../../shared/path/types"

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
    /** Optional preview image URL for the course-owned Playground hub. */
    playgroundPreviewImageUrl?: string
    /** The pricing phases of the course. */
    pricingPhases: Array<CoursePricingJson>
    /** The livestream sessions of the course. */
    livestreamSessions: Array<LivestreamSessionJson>
}

/** Ordinal of the course in the seed list (mount folder `{courseIndex}-{slug}`). */
export interface ParseCourseParams {
    /** The paths of the course. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
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

/**
 * One parsed course folder: the upsert payload plus mount ordinal/path so later
 * steps (modules, milestones) can attach without re-walking `data/courses/`.
 */
export interface ParseCourseResult {
    /** The course of the course. */
    data: DeepPartial<CourseEntity>
    /** The index of the course. */
    index: number
    /** The relative path of the course. */
    relativePath: string
}
/** Parsed courses from the mount. */
export interface ParseCourseManyResult {
    /** The courses of the course. */
    courses: Array<DeepPartial<CourseEntity>>
}
