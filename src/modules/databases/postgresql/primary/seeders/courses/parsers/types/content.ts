import type {
    ExtractChallengeBlockBothParams,
    ExtractChallengeBlockBothResult,
} from "./challenge"

/** Same dual-locale block extraction as challenges; shared shape for markdown sections. */
export type ExtractContentBlockBothParams = ExtractChallengeBlockBothParams

/** English and Vietnamese bodies for one content markdown section. */
export type ExtractContentBlockBothResult = ExtractChallengeBlockBothResult

/** Ordinals locating `modules/{module}/contents/{contentIndex}-{slug}/` on the course mount. */
export interface ParseContentParams {
    courseIndex: number
    moduleIndex: number
    /** Folder index under `contents/` (matches `orderIndex` on the entity). */
    contentIndex: number
}

/** Optional fields in content `data.json` (headings and references come from markdown). */
export interface ContentDataJson {
    /** Estimated minutes to read the article. */
    minutesRead?: number
}

/** Ordinals locating `modules/{module}/contents/` on the course mount. */
export interface ContentIndexesParams {
    courseIndex: number
    moduleIndex: number
}

/** Sorted `contentIndex` values found under `contents/`. */
export type ListContentIndexesResult = Array<number>