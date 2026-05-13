import {
    ResolvedFilePath 
} from "../../path"
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
    /** The paths of the content. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The index of the module. */
    moduleIndex: number
    /** The index of the content. */
    contentIndex: number
}

/** Ordinals locating `modules/{module}/contents/` on the course mount. */
export interface ParseContentManyParams {
    /** The relative path of the module. */
    moduleRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The index of the module. */
    moduleIndex: number
}
/** Optional structured fields from `# Content Data` in `en.md` or content `data.json`. */
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
