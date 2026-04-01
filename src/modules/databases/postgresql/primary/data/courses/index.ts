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

/** All courses data. */
export const seedCourses: Array<DeepPartial<CourseEntity>> = [
    fullstackMasteryCourse,
]