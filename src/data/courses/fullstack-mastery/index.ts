import type {
    DeepPartial,
} from "typeorm"
import type {
    CourseEntity,
} from "@modules/databases"
import {
    fullstackMasteryCourseBase,
} from "./course"
import {
    fullstackMasteryModules,
} from "./modules"

/** Nested course seed: base row + ordered modules. */
export const fullstackMasteryCourse: DeepPartial<CourseEntity> = {
    ...fullstackMasteryCourseBase,
    modules: fullstackMasteryModules,
}
