import {
    DeepPartial 
} from "typeorm"
import {
    CourseEntity 
} from "../../../entities"
import {
    fullstackMasteryCourse 
} from "./fullstack-mastery"

/**
 * Courses data.
 */
export const courses: Array<DeepPartial<CourseEntity>> = [
    fullstackMasteryCourse,
]
