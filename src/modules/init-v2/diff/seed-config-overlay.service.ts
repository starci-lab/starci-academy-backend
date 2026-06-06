import {
    Injectable,
} from "@nestjs/common"
import type {
    SeedConfig,
    SeedCourseTrack,
    SeedSyncCourseTrack,
} from "@modules/filesystem"
import type {
    BuildDiffOverlayResult,
    DataGitDiff,
} from "./types"

/**
 * Builds the full {@link SeedConfig} the existing pipeline understands.
 *
 * `seed-v2.yaml` only carries the seed MODE (`all`/`diff`/`none`); the course
 * set is derived at boot — every course discovered in `.contexts` for `all`,
 * or the changed set for `diff`. Applied via `setRuntimeSeedConfig`, so the
 * shared pipeline scopes itself with no shared-code edits.
 */
@Injectable()
export class SeedDiffOverlayService {

    /**
     * Builds the full-scope config: every given course/sink set to `all`.
     *
     * @param courseDisplayIds - Course displayIds discovered in `.contexts`
     * @returns A complete config with `all` module/milestone/sink scopes
     */
    buildFullConfig(courseDisplayIds: Array<string>): SeedConfig {
        const tracks: Record<string, SeedCourseTrack> = {
        }
        const syncCourses: Record<string, SeedSyncCourseTrack> = {
        }
        // each course seeds + syncs ALL of its modules and milestones
        for (const displayId of courseDisplayIds) {
            tracks[displayId] = {
                course: true,
                modules: "all",
                milestones: "all",
            }
            syncCourses[displayId] = {
                course: true,
                modules: {
                    cdn: "all",
                    elasticsearch: "all",
                    repo: [],
                },
                milestones: {
                    cdn: "all",
                    elasticsearch: "all",
                    repo: [],
                },
            }
        }
        return this.assemble(tracks,
            syncCourses,
            false)
    }

    /**
     * Builds the diff-narrowed config: each changed course scoped to only the
     * module/milestone order-indexes that changed. Courses are derived from the
     * diff itself (no external list).
     *
     * @param diff - The structured diff describing what changed in the data repo
     * @returns The narrowed config (or `null` for full reseed) plus scope counts
     */
    buildDiffConfig(diff: DataGitDiff): BuildDiffOverlayResult {
        // an unscopable diff (unknown paths) → caller falls back to a full reseed
        if (diff.fullReseed) {
            return {
                overlay: null,
                courseCount: 0,
                moduleCount: 0,
                domainCount: 0,
            }
        }
        // the set of courses touched by the diff (modules / milestones / root / quiz)
        const displayIds = new Set<string>([
            ...diff.moduleIndicesByCourse.keys(),
            ...diff.milestoneIndicesByCourse.keys(),
            ...diff.courseRootChanged,
            ...diff.quizChangedCourses,
        ])

        const tracks: Record<string, SeedCourseTrack> = {
        }
        const syncCourses: Record<string, SeedSyncCourseTrack> = {
        }
        let moduleCount = 0
        let quizChangedAny = false
        for (const displayId of displayIds) {
            const modules = this.sortedIndexes(diff.moduleIndicesByCourse.get(displayId))
            const milestones = this.sortedIndexes(diff.milestoneIndicesByCourse.get(displayId))
            const rootChanged = diff.courseRootChanged.has(displayId)
            const quizChanged = diff.quizChangedCourses.has(displayId)
            quizChangedAny = quizChangedAny || quizChanged
            moduleCount += modules.length
            // seed track: re-seed the course root only when its own files changed
            tracks[displayId] = {
                course: rootChanged,
                modules,
                milestones,
            }
            // sync track: refresh the course catalog + push only the changed indexes
            syncCourses[displayId] = {
                course: true,
                modules: {
                    cdn: modules,
                    elasticsearch: modules,
                    repo: [],
                },
                milestones: {
                    cdn: milestones,
                    elasticsearch: milestones,
                    repo: [],
                },
            }
        }
        return {
            overlay: this.assemble(tracks,
                syncCourses,
                quizChangedAny),
            courseCount: Object.keys(tracks).length,
            moduleCount,
            domainCount: 0,
        }
    }

    /**
     * Assembles a full {@link SeedConfig} from the resolved course tracks.
     *
     * Standalone domains stay off (InitV2 scope is courses-only); on a partial
     * sync `reIndex` is forced false so unchanged ES data is never wiped.
     *
     * @param tracks - Seed course tracks keyed by displayId
     * @param syncCourses - Sync course tracks keyed by displayId
     * @param quizEnabled - Whether the quiz pass should run
     * @returns The full seed config
     */
    private assemble(
        tracks: Record<string, SeedCourseTrack>,
        syncCourses: Record<string, SeedSyncCourseTrack>,
        quizEnabled: boolean,
    ): SeedConfig {
        return {
            seeders: {
                enabled: true,
                courses: {
                    enabled: true,
                    tracks,
                    quiz: {
                        enabled: quizEnabled,
                        linkContents: false,
                    },
                },
                cv: false,
                foundations: false,
                headhunting: false,
                aiModels: false,
                subscriptions: false,
                codingProblems: false,
            },
            synchronizers: {
                enabled: true,
                reIndex: false,
                courses: syncCourses,
                cv: false,
                foundations: false,
                headhunting: false,
            },
        }
    }

    /**
     * Converts a changed-index set into a sorted order-index array (empty when absent).
     *
     * @param indexes - The changed order-index set for a course, or undefined
     * @returns A sorted array of order-indexes
     */
    private sortedIndexes(indexes: Set<number> | undefined): Array<number> {
        // no entry for this course → nothing changed → empty allow-list
        if (!indexes) {
            return []
        }
        return [...indexes].sort((prev, next) => prev - next)
    }
}
