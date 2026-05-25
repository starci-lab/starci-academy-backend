import type {
    CourseIndexFilterByDisplayId,
} from "../../../types"
import {
    buildMilestoneIndexFilterByDisplayId,
    buildModuleIndexFilterByDisplayId,
    getInitSeedersContext,
} from "../../../utils"

/** Course seed filters from `envConfig().init` seeders `courses`. */
export interface CourseSeedScope {
    /** `null` = no env map (unrestricted). */
    moduleIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    milestoneIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
}

const UNRESTRICTED_SCOPE: CourseSeedScope = {
    moduleIndexFilterByDisplayId: null,
    milestoneIndexFilterByDisplayId: null,
}

/**
 * Resolves module/milestone filters from `envConfig().init` seeders `courses`.
 * Each course is always present in the map: `"all"` | `"off"` | `[0,1,…]`.
 */
export const resolveCourseSeedScope = (): CourseSeedScope => {
    const context = getInitSeedersContext()
    if (!context) {
        return UNRESTRICTED_SCOPE
    }
    return {
        moduleIndexFilterByDisplayId: buildModuleIndexFilterByDisplayId(
            context.courses,
        ),
        milestoneIndexFilterByDisplayId: buildMilestoneIndexFilterByDisplayId(
            context.courses,
        ),
    }
}

/** Whether CV mount seeding is enabled (`INIT_SEEDERS_CV`). */
export const isCvSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.cv.enabled ?? true
}

/** Whether foundations mount seeding is enabled (`INIT_SEEDERS_FOUNDATIONS`). */
export const isFoundationsSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.foundations.enabled ?? true
}

/** Whether headhunting mount seeding is enabled (`INIT_SEEDERS_HEADHUNTING`). */
export const isHeadhuntingSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.headhunting.enabled ?? true
}
