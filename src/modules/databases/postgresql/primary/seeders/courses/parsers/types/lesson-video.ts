import type {
    LessonVideoType,
    VideoHostPlatform,
} from "../../../../enums"
import {
    ResolvedFilePath,
} from "../../path"

/** Ordinals locating `modules/{module}/lession-videos/{lessonVideoIndex}-{slug}/` on the mount. */
export interface ParseLessonVideoParams {
    /** The paths of the lesson video. */
    paths: Array<ResolvedFilePath>
    /** Course index. */
    courseIndex: number
    /** Module index. */
    moduleIndex: number
    /** Content index. */
    contentIndex: number
    /** Lesson video index. */
    lessonVideoIndex: number
}

/** Ordinals locating `modules/{module}/lession-videos/{lessonVideoIndex}-{slug}/` on the mount. */
export interface ParseLessonVideoManyParams {
    /** The relative path of the content. */
    contentRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The index of the module. */
    moduleIndex: number
    /** The index of the content. */
    contentIndex: number
}

/** Params for listing lesson-video folder indices. */
export interface LessonVideoIndexesParams {
    /** Course index. */
    courseIndex: number
    /** Module index. */
    moduleIndex: number
    /** Content index. */
    contentIndex: number
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
    /** Video delivery format; if omitted defaults to Standard. */
    videoType?: LessonVideoType
    /** Host platform; if omitted, inferred from `url` when possible (e.g. YouTube, Drive). */
    hostPlatform?: VideoHostPlatform
}