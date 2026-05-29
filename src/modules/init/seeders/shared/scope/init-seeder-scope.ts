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

/** Whether the whole course seeder is enabled (`INIT_SEEDERS_COURSES_ENABLED`). */
export const isCoursesSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.courses.enabled ?? true
}

/** Whether course-level quiz deck seeding is enabled (`INIT_SEEDERS_COURSES_QUIZ_ENABLED`). */
export const isCoursesQuizSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.courses.quiz.enabled ?? true
}

/** Whether quiz decks link to lesson contents (`INIT_SEEDERS_COURSES_QUIZ_LINK_CONTENTS`). */
export const isCoursesQuizLinkContentsEnabled = (): boolean => {
    return getInitSeedersContext()?.courses.quiz.linkContents ?? false
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

/** Whether AI model catalog mount sync is enabled (`INIT_SEEDERS_AI_MODELS`). */
export const isAiModelsCatalogSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.aiModels.enabled ?? true
}

/** Whether subscription catalog mount sync is enabled (`INIT_SEEDERS_SUBSCRIPTIONS`). */
export const isSubscriptionsCatalogSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.subscriptions.enabled ?? true
}

/** Whether coding-problem mount seeding is enabled (`INIT_SEEDERS_CODING_PROBLEMS`). */
export const isCodingProblemsSeederEnabled = (): boolean => {
    return getInitSeedersContext()?.codingProblems.enabled ?? true
}
