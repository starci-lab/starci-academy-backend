import type {
    SeedScopeIndexes,
} from "@modules/filesystem"
import type {
    CourseIndexFilterByDisplayId,
} from "../../types"
import {
    parseScopeIndexes,
} from "./parse-scope-indexes"

/**
 * Build a per-course `orderIndex` filter map from `seed.yaml` track entries.
 *
 * Iterates the `displayId`-keyed track record and resolves each track's scope
 * value (via {@link parseScopeIndexes}) into the shared
 * {@link CourseIndexFilterByDisplayId} consumed by the seed/sync predicates.
 *
 * @param tracksByDisplayId - `seed.yaml` tracks keyed by course displayId
 * @param pickIndexes - selects the scope value from one track (modules / milestones / sink)
 * @returns Filter map keyed by displayId (`null` = all, `Set()` = off, `Set(n...)` = allow-list)
 */
export const buildCourseIndexFilterByDisplayId = <TrackType>(
    tracksByDisplayId: Record<string, TrackType>,
    pickIndexes: (track: TrackType) => SeedScopeIndexes,
): CourseIndexFilterByDisplayId => {
    const filter: CourseIndexFilterByDisplayId = new Map()
    for (const [
        displayId,
        track,
    ] of Object.entries(tracksByDisplayId)) {
        filter.set(
            displayId,
            parseScopeIndexes(pickIndexes(track)),
        )
    }
    return filter
}
