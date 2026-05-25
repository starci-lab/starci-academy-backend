import {
    envConfig,
} from "@modules/env"
import type {
    CourseIndexFilterByDisplayId,
    InitCourseIndexScope,
    InitCourseTracksContext,
    InitSeedersContext,
    InitSeedersCoursesContext,
    InitSynchronizerCourseTracksContext,
    InitSynchronizersContext,
    InitSynchronizersCoursesContext,
    SynchronizerSyncScope,
} from "../types"
import {
    INIT_FULLSTACK_COURSE_DISPLAY_ID,
    INIT_SYSTEM_DESIGN_COURSE_DISPLAY_ID,
} from "../types"

/**
 * Parses env `indexes` for modules / milestones.
 *
 * - `"all"` or empty → `null` (no filter; include every `orderIndex` for that course).
 * - `"0,1,2"` → allow-list of `orderIndex` values only.
 */
export const parseOptionalOrderIndexList = (
    raw: string,
): Set<number> | null => {
    const trimmed = raw.trim()
    if (!trimmed || trimmed.toLowerCase() === "all") {
        return null
    }
    const indexes = trimmed
        .split(",")
        .map((part) => parseInt(part.trim(),
            10))
        .filter((value) => !Number.isNaN(value))
    return indexes.length > 0 ? new Set(indexes) : null
}

/** List of course tracks. */
const COURSE_TRACK_ENTRIES: Array<{
    displayId: string
    trackKey: keyof InitSeedersCoursesContext
}> = [
    {
        displayId: INIT_FULLSTACK_COURSE_DISPLAY_ID,
        trackKey: "fullstack",
    },
    {
        displayId: INIT_SYSTEM_DESIGN_COURSE_DISPLAY_ID,
        trackKey: "systemDesign",
    },
]

/**
 * Builds per-course index filters from init `courses.*.modules` or `courses.*.milestones` context.
 *
 * @param pickScope - function to pick the scope from the courses context
 * @param courses - the courses context
 * @returns a map of course display ids to sets of order indexes
 */
const buildIndexFilterFromTrackScope = (
    pickScope: (
        tracks: InitCourseTracksContext | InitSynchronizerCourseTracksContext,
    ) => InitCourseIndexScope,
    courses: InitSeedersCoursesContext | InitSynchronizersCoursesContext,
): CourseIndexFilterByDisplayId => {
    const filter: CourseIndexFilterByDisplayId = new Map()
    for (const {
        displayId,
        trackKey,
    } of COURSE_TRACK_ENTRIES) {
        const scope = pickScope(courses[trackKey])
        if (!scope.enabled) {
            filter.set(displayId,
                new Set())
            continue
        }
        const indexes = parseOptionalOrderIndexList(scope.indexes)
        filter.set(
            displayId,
            indexes ?? null,
        )
    }
    return filter
}

/**
 * Builds per-course module filters from init `courses.*.modules` context.
 */
export const buildModuleIndexFilterByDisplayId = (
    courses: InitSeedersCoursesContext,
): CourseIndexFilterByDisplayId => buildIndexFilterFromTrackScope(
    (tracks) => tracks.modules,
    courses,
)

/**
 * Builds per-course milestone filters from init `courses.*.milestones` context.
 */
export const buildMilestoneIndexFilterByDisplayId = (
    courses: InitSeedersCoursesContext,
): CourseIndexFilterByDisplayId => buildIndexFilterFromTrackScope(
    (tracks) => tracks.milestones,
    courses,
)

const buildSynchronizerModuleIndexFilter = (
    courses: InitSynchronizersCoursesContext,
    sink: "cdn" | "elasticsearch",
): CourseIndexFilterByDisplayId => buildIndexFilterFromTrackScope(
    (tracks) => tracks.modules[sink],
    courses,
)

const buildSynchronizerMilestoneIndexFilter = (
    courses: InitSynchronizersCoursesContext,
    sink: "cdn" | "elasticsearch",
): CourseIndexFilterByDisplayId => buildIndexFilterFromTrackScope(
    (tracks) => tracks.milestones[sink],
    courses,
)

const buildSynchronizerSyncScopeForSink = (
    sink: "cdn" | "elasticsearch",
): SynchronizerSyncScope => {
    const context = getInitSynchronizersContext()
    return {
        moduleIndexFilterByDisplayId: context
            ? buildSynchronizerModuleIndexFilter(context.courses,
                sink)
            : null,
        milestoneIndexFilterByDisplayId: context
            ? buildSynchronizerMilestoneIndexFilter(context.courses,
                sink)
            : null,
        foundations: context?.foundations.enabled ?? true,
        headhunting: context?.headhunting.enabled ?? true,
    }
}

/**
 * `true` when this course track uses an allow-list (`Set`) or is disabled (`Set()`), not `"all"` (`null`).
 */
export const isRestrictedCourseTrackSeed = (
    filter: CourseIndexFilterByDisplayId | null,
    courseDisplayId: string,
): boolean => {
    if (!filter) {
        return false
    }
    const allowed = filter.get(courseDisplayId)
    return allowed instanceof Set
}

/** JSON-friendly view for logs (`null` → `"all"`, `Set()` → `"off"`). */
export const formatCourseIndexFilter = (
    filter: CourseIndexFilterByDisplayId | null,
): Record<string, string | Array<number>> => {
    if (!filter) {
        return {
        }
    }
    const out: Record<string, string | Array<number>> = {
    }
    for (const [
        displayId,
        allowed,
    ] of filter.entries()) {
        if (allowed === null) {
            out[displayId] = "all"
        } else if (allowed.size === 0) {
            out[displayId] = "off"
        } else {
            out[displayId] = Array.from(allowed).sort((a, b) => a - b)
        }
    }
    return out
}

/**
 * Whether a module/milestone should be included for the given course.
 *
 * Map value: `null` = all order indexes; `Set(n…)` = allow-list only (e.g. `0,1` → folders `0-*`, `1-*`).
 * Unknown `courseDisplayId` → exclude (avoids seeding every index when displayId does not match env tracks).
 */
const shouldIncludeByOrderIndex = (
    filter: CourseIndexFilterByDisplayId | null,
    courseDisplayId: string,
    orderIndex: number,
): boolean => {
    if (!filter) {
        return true
    }
    const allowed = filter.get(courseDisplayId)
    if (allowed === undefined) {
        return false
    }
    if (allowed === null) {
        return true
    }
    if (allowed.size === 0) {
        return false
    }
    return allowed.has(orderIndex)
}

/**
 * Whether a module should be seeded/synced for the given course.
 */
export const shouldIncludeCourseModule = (
    filter: CourseIndexFilterByDisplayId | null,
    courseDisplayId: string,
    moduleOrderIndex: number,
): boolean => shouldIncludeByOrderIndex(
    filter,
    courseDisplayId,
    moduleOrderIndex,
)

/**
 * Whether a milestone should be seeded/synced for the given course.
 */
export const shouldIncludeCourseMilestone = (
    filter: CourseIndexFilterByDisplayId | null,
    courseDisplayId: string,
    milestoneOrderIndex: number,
): boolean => shouldIncludeByOrderIndex(
    filter,
    courseDisplayId,
    milestoneOrderIndex,
)

export const getInitSeedersContext = (): InitSeedersContext | undefined => {
    const handler = envConfig().init.find((entry) => entry.name === "seeders")
    return handler?.context as InitSeedersContext | undefined
}

export const getInitSynchronizersContext = (): InitSynchronizersContext | undefined => {
    const handler = envConfig().init.find((entry) => entry.name === "synchronizers")
    return handler?.context as InitSynchronizersContext | undefined
}

/** Scope for CDN materialization (S3 JSON). */
export const buildCdnSynchronizerSyncScope = (): SynchronizerSyncScope =>
    buildSynchronizerSyncScopeForSink("cdn")

/** Scope for Elasticsearch indexing. */
export const buildElasticsearchSynchronizerSyncScope = (): SynchronizerSyncScope =>
    buildSynchronizerSyncScopeForSink("elasticsearch")

/** @deprecated Use {@link buildCdnSynchronizerSyncScope} or {@link buildElasticsearchSynchronizerSyncScope}. */
export const buildSynchronizerSyncScope = (): SynchronizerSyncScope =>
    buildCdnSynchronizerSyncScope()
