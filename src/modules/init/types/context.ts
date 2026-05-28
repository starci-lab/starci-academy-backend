/** Mount / DB `displayId` for Fullstack Mastery. */
export const INIT_FULLSTACK_COURSE_DISPLAY_ID = "fullstack-mastery"

/** Mount / DB `displayId` for System Design Mastery. */
export const INIT_SYSTEM_DESIGN_COURSE_DISPLAY_ID = "system-design-mastery"

/** Module / milestone scope for one course track. */
export interface InitCourseIndexScope {
    /** `"all"` = every item; `"0,1"` = only mount folders `0-*` and `1-*` (`orderIndex` 0 and 1). */
    indexes: string
    /** `false` = skip all items in this track for the course. */
    enabled: boolean
}

/** Per-course module and milestone seed/sync scopes (independent). */
export interface InitCourseTracksContext {
    modules: InitCourseIndexScope
    milestones: InitCourseIndexScope
}

export interface InitSeedersCoursesContext {
    fullstack: InitCourseTracksContext
    systemDesign: InitCourseTracksContext
}

export interface InitToggleContext {
    enabled: boolean
}

export interface InitSeedersContext {
    courses: InitSeedersCoursesContext
    cv: InitToggleContext
    foundations: InitToggleContext
    headhunting: InitToggleContext
    aiModels: InitToggleContext
    subscriptions: InitToggleContext
}

/** Per-track synchronizer scopes (CDN and Elasticsearch are independent). */
export interface InitSynchronizerCourseTracksContext {
    modules: {
        cdn: InitCourseIndexScope
        elasticsearch: InitCourseIndexScope
    }
    milestones: {
        cdn: InitCourseIndexScope
        elasticsearch: InitCourseIndexScope
    }
}

export interface InitSynchronizersCoursesContext {
    fullstack: InitSynchronizerCourseTracksContext
    systemDesign: InitSynchronizerCourseTracksContext
}

export interface InitSynchronizersContext {
    courses: InitSynchronizersCoursesContext
    cv: InitToggleContext
    foundations: InitToggleContext
    headhunting: InitToggleContext
}

/** Per-course module/milestone filter: `null` = all, `Set()` = disabled, `Set(n…)` = allow-list. */
export type CourseIndexFilterByDisplayId = Map<string, Set<number> | null>

export interface SynchronizerSyncScope {
    /** `null` = unrestricted (no env map); otherwise one entry per course track. */
    moduleIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    milestoneIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    foundations: boolean
    headhunting: boolean
}
