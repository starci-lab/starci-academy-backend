import {
    EmptyObject 
} from "@modules/common"

/** Ordinal of the course and module in the seed list (mount folders `{index}-{slug}`). */
export interface ParseModuleParams {
    courseIndex: number
    moduleIndex: number
}

/** Params for listing indexed `modules/{index}-{slug}/` on the mount. */
export interface ModuleIndexesParams {
    courseStorageDirName: string
}

/** Optional extra fields in module `data.json` (display id comes from the folder name). */
export type ModuleDataJson = EmptyObject