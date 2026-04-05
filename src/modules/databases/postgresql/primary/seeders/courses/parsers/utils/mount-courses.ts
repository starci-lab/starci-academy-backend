import fs from "fs"
import {
    courseAlias,
} from "../../utils"

/** Ordinals we know how to resolve to a mount folder name via {@link courseAlias}. */
const KNOWN_COURSE_INDICES = [
    0,
    1,
    2,
] as const

/**
 * Course indices whose `courses/{courseAlias(i)}/` folder exists under `coursesRoot`.
 *
 * @param coursesRoot - Absolute `data/courses` path
 * @returns Sorted ordinals (not folder names)
 */
export const listMountedCourseIndices = (
    coursesRoot: string,
): Array<number> => {
    if (!fs.existsSync(coursesRoot)) {
        return []
    }
    const names = new Set(
        fs.readdirSync(
            coursesRoot,
        ),
    )
    const indices: Array<number> = []
    for (const i of KNOWN_COURSE_INDICES) {
        const dir = courseAlias(
            i,
        )
        if (dir !== undefined && names.has(dir)) {
            indices.push(
                i,
            )
        }
    }
    return indices
}
