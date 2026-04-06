import type {
    ExtractChallengeBlockBothParams,
    ExtractChallengeBlockBothResult,
} from "./challenge"

/** Dual-locale block extraction for lesson video markdown (Title, Description). */
export type ExtractLessonVideoBlockBothParams = ExtractChallengeBlockBothParams

export type ExtractLessonVideoBlockBothResult = ExtractChallengeBlockBothResult

/** Ordinals locating `modules/{module}/lession-videos/{lessonVideoIndex}-{slug}/` on the mount. */
export interface ParseLessonVideoParams {
    courseIndex: number
    moduleIndex: number
    /** Folder index under the lesson-videos directory (matches entity `orderIndex`). */
    lessonVideoIndex: number
}

/** Params for listing lesson-video folder indices. */
export interface LessonVideoIndexesParams {
    courseIndex: number
    moduleIndex: number
}

/** Sorted `lessonVideoIndex` values under `lession-videos/`. */
export type ListLessonVideoIndexesResult = Array<number>

/** `data.json` next to `en.md` / `vi.md` (stream URL and timing). */
export interface LessonVideoDataJson {
    /** Watch or embed URL (e.g. YouTube). */
    url: string
    /** Playback length in milliseconds. */
    durationMs: number
    /** Optional poster / thumbnail URL. */
    thumbnailUrl?: string
}