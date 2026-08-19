import type {
    DataGitDiff,
    DataGitDomain,
} from "../types/diff"

/**
 * Maps a changed top-level repo folder to the standalone seed domain it feeds.
 *
 * Note the on-disk folder names differ from the flag names: `headhuntings`
 * (plural) and `subcriptions` (intentional misspelling) match the actual repo.
 * `templates` holds CV templates, so it gates the `cv` domain.
 */
const DOMAIN_BY_TOP_LEVEL_DIR: Record<string, DataGitDomain> = {
    cv: "cv",
    templates: "cv",
    foundations: "foundations",
    headhuntings: "headhunting",
    "coding-problems": "codingProblems",
    "ai-models": "aiModels",
    subcriptions: "subscriptions",
}

/**
 * Strip the leading `{orderIndex}-` from a mount directory name to get its displayId.
 *
 * @param name - Directory name like `0-fullstack-mastery`
 * @returns The displayId (`fullstack-mastery`), or the name unchanged when no prefix
 */
const stripOrderIndex = (name: string): string => {
    // course/module dirs follow `{index}-{slug}`; the slug is the displayId
    const match = /^\d+-(.+)$/u.exec(name)
    return match ? match[1] : name
}

/**
 * Parse the leading integer order-index from a mount directory name.
 *
 * @param name - Directory name like `4-server-state`
 * @returns The order-index, or `null` when the name has no numeric prefix
 */
const parseLeadingIndex = (name: string): number | null => {
    const match = /^(\d+)/u.exec(name)
    return match ? Number.parseInt(match[1],
        10) : null
}

/**
 * Add an order-index into a per-course set map, creating the set on first use.
 */
const addCourseIndex = (
    map: Map<string, Set<number>>,
    displayId: string,
    index: number,
): void => {
    // lazily create the per-course set so absent courses stay out of the map
    const existing = map.get(displayId)
    if (existing) {
        existing.add(index)
        return
    }
    map.set(displayId,
        new Set([index]))
}

/**
 * Remove the configured `subdir` prefix from a repo-relative path.
 *
 * @param rawPath - Path as returned by the GitHub compare API
 * @param subdir - Configured sub-directory (empty when the repo root is the data root)
 * @returns The path relative to the data root, or `null` when it lies outside `subdir`
 */
const stripSubdir = (rawPath: string, subdir: string): string | null => {
    // no subdir -> the whole repo maps to the data root
    if (!subdir) {
        return rawPath
    }
    // the subdir entry itself carries no seedable content
    if (rawPath === subdir) {
        return ""
    }
    // keep only paths nested under the subdir; anything else is unrelated repo content
    const prefix = `${subdir}/`
    return rawPath.startsWith(prefix)
        ? rawPath.slice(prefix.length)
        : null
}

/**
 * Classify one `courses/...` path into the diff (mutates `diff`).
 *
 * @param segments - Path segments, starting with `courses`
 * @param diff - The diff accumulator to update
 */
const classifyCoursePath = (
    segments: Array<string>,
    diff: DataGitDiff,
): void => {
    // need at least `courses/<courseDir>` to identify a course
    if (segments.length < 2) {
        // a stray file directly under courses/ -- cannot scope it safely
        diff.fullReseed = true
        return
    }
    const displayId = stripOrderIndex(segments[1])
    // `courses/<courseDir>` (no deeper segment) -> treat as a course-root touch
    if (segments.length === 2) {
        diff.courseRootChanged.add(displayId)
        return
    }
    const subFolder = segments[2]
    // module / milestone tracks are indexed; capture which order-index changed
    if (subFolder === "modules" || subFolder === "milestones") {
        const trackIndex = parseLeadingIndex(segments[3] ?? "")
        // a file straight under modules/ (no `{index}-` dir) is unexpected -> full reseed
        if (trackIndex === null) {
            diff.fullReseed = true
            return
        }
        const targetMap = subFolder === "modules"
            ? diff.moduleIndicesByCourse
            : diff.milestoneIndicesByCourse
        addCourseIndex(targetMap,
            displayId,
            trackIndex)
        return
    }
    // flashcard decks are seeded per-course (no index), gate the whole flashcard pass
    if (subFolder === "flashcard-decks") {
        diff.flashcardChangedCourses.add(displayId)
        return
    }
    // anything else directly under the course dir (en.md, vi.md, master_plan.md, ...) is course-root
    diff.courseRootChanged.add(displayId)
}

/**
 * Build a structured {@link DataGitDiff} from the raw changed-path list.
 *
 * Unclassifiable paths set `fullReseed = true` so the caller never under-seeds.
 *
 * @param changedPaths - Repo-relative paths from the GitHub compare API
 * @param subdir - Configured data sub-directory (empty = repo root)
 * @returns The structured diff used to narrow the seed/sync scope
 */
export const parseDataGitDiff = (
    changedPaths: Array<string>,
    subdir: string,
): DataGitDiff => {
    const diff: DataGitDiff = {
        fullReseed: false,
        moduleIndicesByCourse: new Map(),
        milestoneIndicesByCourse: new Map(),
        courseRootChanged: new Set(),
        flashcardChangedCourses: new Set(),
        changedDomains: new Set(),
    }
    for (const rawPath of changedPaths) {
        // drop paths outside the configured subdir; normalize the rest to the data root
        const relative = stripSubdir(rawPath,
            subdir)
        if (relative === null) {
            continue
        }
        const segments = relative.split("/").filter(Boolean)
        // an empty path (e.g. the subdir entry itself) carries nothing seedable
        if (segments.length === 0) {
            continue
        }
        const topLevel = segments[0]
        // authoring rules are not seeded -- ignore their changes
        if (topLevel === "rules") {
            continue
        }
        // course content has its own indexed classification
        if (topLevel === "courses") {
            classifyCoursePath(segments,
                diff)
            continue
        }
        // standalone domains gate their seeder on/off
        const domain = DOMAIN_BY_TOP_LEVEL_DIR[topLevel]
        if (domain) {
            diff.changedDomains.add(domain)
            continue
        }
        // an unknown top-level entry means we cannot guarantee scope -> full reseed
        diff.fullReseed = true
    }
    return diff
}
