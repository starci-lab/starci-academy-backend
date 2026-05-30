import {
    buildMilestoneIndexFilterByDisplayId,
    buildModuleIndexFilterByDisplayId,
    getInitSeedersContext,
} from "../../../utils"
import type {
    CourseSeedScope,
} from "./types"

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

/** Whether the whole course seeder is enabled (`envConfig().init` seeders `courses.enabled`). */
export const isCoursesSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.courses.enabled ?? true
}

/** Whether course-level quiz deck seeding is enabled (`envConfig().init` seeders `courses.quiz.enabled`). */
export const isCoursesQuizSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.courses.quiz.enabled ?? true
}

/** Whether quiz decks link to lesson contents (`envConfig().init` seeders `courses.quiz.linkContents`). */
export const isCoursesQuizLinkContentsEnabled = (): boolean => {
    return getInitSeedersContext()?.courses.quiz.linkContents ?? false
}

/** Whether CV mount seeding is enabled (`envConfig().init` seeders `cv.enabled`). */
export const isCvSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.cv.enabled ?? true
}

/** Whether foundations mount seeding is enabled (`envConfig().init` seeders `foundations.enabled`). */
export const isFoundationsSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.foundations.enabled ?? true
}

/** Whether headhunting mount seeding is enabled (`envConfig().init` seeders `headhunting.enabled`). */
export const isHeadhuntingSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.headhunting.enabled ?? true
}

/** Whether AI model catalog mount sync is enabled (`envConfig().init` seeders `aiModels.enabled`). */
export const isAiModelsCatalogSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.aiModels.enabled ?? true
}

/** Whether subscription catalog mount sync is enabled (`envConfig().init` seeders `subscriptions.enabled`). */
export const isSubscriptionsCatalogSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.subscriptions.enabled ?? true
}

/** Whether coding-problem mount seeding is enabled (`envConfig().init` seeders `codingProblems.enabled`). */
export const isCodingProblemsSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.codingProblems.enabled ?? true
}
