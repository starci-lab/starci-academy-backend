import type {
    DeepPartial,
} from "typeorm"
import type {
    CourseEntity,
} from "@modules/databases"
import {
    fullstackMasteryCourse,
} from "./fullstack-mastery"

export {
    fullstackMasteryCourse,
} from "./fullstack-mastery"

/**
 * All course seeds (TS), nested per course: course + `modules[]`.
 * When non-empty, `CourseLoaderService` uses this instead of `.mount/seeders/courses`.
 */
export const coursesSeedData: Array<DeepPartial<CourseEntity>> = [
    fullstackMasteryCourse,
]

export const coursesSeedManifest = {
    courses: coursesSeedData.map(
        (c) => c.id as string,
    ),
}