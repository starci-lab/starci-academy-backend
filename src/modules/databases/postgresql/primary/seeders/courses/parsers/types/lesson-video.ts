import type {
    ExtractChallengeBlockBothParams,
    ExtractChallengeBlockBothResult,
} from "./challenge"
import type {
    LessonVideoKind,
    VideoHostPlatform,
} from "../../../../enums"

/** Dual-locale block extraction for lesson video markdown (Title, Description). */
export type ExtractLessonVideoBlockBothParams = ExtractChallengeBlockBothParams

export type ExtractLessonVideoBlockBothResult = ExtractChallengeBlockBothResult

/** Ordinals locating `modules/{module}/lession-videos/{lessonVideoIndex}-{slug}/` on the mount. */
export interface ParseLessonVideoParams {
    /** Course index. */
    courseIndex: number
    /** Module index. */
    moduleIndex: number
    /** Lesson video index. */
    lessonVideoIndex: number
}

/** Params for listing lesson-video folder indices. */
export interface LessonVideoIndexesParams {
    /** Course index. */
    courseIndex: number
    /** Module index. */
    moduleIndex: number
}

/** Sorted `lessonVideoIndex` values under `lession-videos/`. */
export type ListLessonVideoIndexesResult = Array<number>

/** `data.json` next to `en.md` / `vi.md` (stream URL and timing). */
export interface LessonVideoDataJson {
    /** Watch or embed URL (e.g. YouTube, Google Drive). */
    url?: string
    /** Playback length in milliseconds. */
    durationMs?: number
    /** Optional poster / thumbnail URL. Empty string is treated as unset. */
    thumbnailUrl?: string
    /** Production type; if omitted, inferred from folder slug when possible (e.g. `*-raw-stream`). */
    kind?: LessonVideoKind
    /** Host platform; if omitted, inferred from `url` when possible (e.g. YouTube, Drive). */
    hostPlatform?: VideoHostPlatform
}