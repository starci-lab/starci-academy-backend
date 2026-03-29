import type {
    CourseEntity 
} from "../../../entities"
import type {
    DeepPartial 
} from "typeorm"

/** Root mount manifest schema for `.mount/seeders/courses/data.json`. */
export interface CoursesMountIndex {
    courses?: Array<string>
}

/** Resolved filesystem path for a numbered module seed under `modules/<n>/data.json`. */
export interface ModuleSeedFileEntry {
    order: number
    path: string
}

/** All course payloads loaded from the mount seed directory. */
export type LoadCoursesResult = Array<DeepPartial<CourseEntity>>

/** Params for reading a single course JSON file from disk. */
export interface ReadCoursePayloadParams {
    courseDir: string
}

/** Params for loading module JSON files under a course `modules` directory. */
export interface LoadModulesFromDirParams {
    modulesDir: string
}

/** Params for validating a manifest entry against disk. */
export interface IsValidManifestCourseDirParams {
    root: string
    name: string
}
