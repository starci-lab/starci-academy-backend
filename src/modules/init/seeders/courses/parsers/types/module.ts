import {
    EmptyObject 
} from "@modules/common"
import {
    ResolvedFilePath,
} from "../../../shared"

/** Ordinal of the course and module in the seed list (mount folders `{index}-{slug}`). */
export interface ParseModuleParams {
    /** The paths of the module. */
    paths: Array<ResolvedFilePath>
    /** The index of the module. */
    moduleIndex: number
    /** The relative path of the course. */
    courseIndex: number
}

/** Ordinal of the course and module in the seed list (mount folders `{index}-{slug}`). */
export interface ParseModuleManyParams {
    /** The relative path of the course. */
    courseRelativePath: string
    /** The index of the course. */
    courseIndex: number
}

/** Optional extra fields in module `data.json` (display id comes from the folder name). */
export type ModuleDataJson = EmptyObject
