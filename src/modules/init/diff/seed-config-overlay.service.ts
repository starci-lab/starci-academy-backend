import {
    Injectable,
} from "@nestjs/common"
import {
    type InitCustomScope,
    type ResolvedCustomCourseScope,
    type SeedConfig,
    type SeedCourseTrack,
    type SeedCustomCourseValue,
    type SeedScopeIndexes,
    type SeedSyncCourseTrack,
} from "@modules/filesystem"
import type {
    BuildDiffOverlayResult,
    DataGitDiff,
} from "./types"

/**
 * Builds the full {@link SeedConfig} the existing pipeline understands.
 *
 * The seed scope is always diff-based: the changed set drives a narrowed
 * overlay, while a first pull / untrustable diff promotes to a full reseed of
 * every course discovered under the active root. Applied via
 * `setRuntimeSeedConfig`, so the shared pipeline scopes itself with no
 * shared-code edits.
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
                    repo: "all",
                },
                milestones: {
                    cdn: "all",
                    elasticsearch: "all",
                    repo: [],
                },
            }
        }
        // coarse full reseed: flashcard + foundations stay off (toggled only via customScope)
        return this.assemble(tracks,
            syncCourses,
            false,
            false)
    }

    /**
     * Builds a custom-scope config from the `customScope` block. Under `courses`,
     * each entry value is either a shorthand module scope (`"all"`, an index list,
     * or a range) or a rich object that also toggles the milestone + flashcard-deck
     * tracks. The `foundations` flag seeds/syncs the standalone foundations domain.
     * Flashcard runs when ANY course opted in (the flashcard pass is a single global flag).
     *
     * @param customScope - The `customScope` block (`courses` map + `foundations`)
     * @returns A complete config restricted to the listed courses/tracks (+ foundations)
     */
    buildCustomConfig(
        customScope: InitCustomScope,
    ): SeedConfig {
        const tracks: Record<string, SeedCourseTrack> = {
        }
        const syncCourses: Record<string, SeedSyncCourseTrack> = {
        }
        // standalone foundations domain is on only when explicitly toggled
        const foundationsEnabled = customScope.foundations === true
        // flashcard seeding is a single global toggle → enable it if ANY course opts in
        let flashcardEnabledAny = false
        for (const [
            displayId,
            value,
        ] of Object.entries(customScope.courses ?? {
            })) {
            // collapse shorthand + object forms into one canonical scope
            const { contents, milestone, flashcardDecks } = this.normalizeCustomScope(value)
            flashcardEnabledAny = flashcardEnabledAny || flashcardDecks
            // milestone track is seeded/synced in full when enabled, else skipped
            const milestoneScope: SeedScopeIndexes = milestone ? "all" : []
            // seed track: course root + the chosen module/contents range (+ milestones)
            tracks[displayId] = {
                course: true,
                modules: contents,
                milestones: milestoneScope,
            }
            // sync track: push the same module range to all sinks; milestones to cdn/es only
            syncCourses[displayId] = {
                course: true,
                modules: {
                    cdn: contents,
                    elasticsearch: contents,
                    repo: contents,
                },
                milestones: {
                    cdn: milestoneScope,
                    elasticsearch: milestoneScope,
                    repo: [],
                },
            }
        }
        return this.assemble(tracks,
            syncCourses,
            flashcardEnabledAny,
            foundationsEnabled)
    }

    /**
     * Normalizes one `customScope.courses` value into a canonical per-course scope.
     *
     * The shorthand form (a bare {@link SeedScopeIndexes}: `"all"`, an index array,
     * or a range string) maps to a contents-only scope with milestone + flashcard off.
     * The object form passes its toggles through (defaulting the booleans to false).
     *
     * @param value - Raw `customScope.courses` entry value (shorthand or object form)
     * @returns The resolved `{ contents, milestone, flashcardDecks }` scope
     */
    private normalizeCustomScope(value: SeedCustomCourseValue): ResolvedCustomCourseScope {
        // object form: only a non-array object carries the per-track toggles
        // ("all" string + index arrays are the shorthand and fall through below)
        if (typeof value === "object" && !Array.isArray(value)) {
            return {
                contents: value.contents,
                milestone: value.milestone === true,
                // YAML key is kebab-cased (`flashcard-decks`) to mirror the mount folder
                flashcardDecks: value["flashcard-decks"] === true,
            }
        }
        // shorthand: the value IS the module/contents scope; other tracks stay off
        return {
            contents: value,
            milestone: false,
            flashcardDecks: false,
        }
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
        // the set of courses touched by the diff (modules / milestones / root / flashcard)
        const displayIds = new Set<string>([
            ...diff.moduleIndicesByCourse.keys(),
            ...diff.milestoneIndicesByCourse.keys(),
            ...diff.courseRootChanged,
            ...diff.flashcardChangedCourses,
        ])

        const tracks: Record<string, SeedCourseTrack> = {
        }
        const syncCourses: Record<string, SeedSyncCourseTrack> = {
        }
        let moduleCount = 0
        let flashcardChangedAny = false
        for (const displayId of displayIds) {
            const modules = this.sortedIndexes(diff.moduleIndicesByCourse.get(displayId))
            const milestones = this.sortedIndexes(diff.milestoneIndicesByCourse.get(displayId))
            const rootChanged = diff.courseRootChanged.has(displayId)
            const flashcardChanged = diff.flashcardChangedCourses.has(displayId)
            flashcardChangedAny = flashcardChangedAny || flashcardChanged
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
                    repo: modules,
                },
                milestones: {
                    cdn: milestones,
                    elasticsearch: milestones,
                    repo: [],
                },
            }
        }
        return {
            // diff-narrowed: foundations stay off (toggled only via customScope)
            overlay: this.assemble(tracks,
                syncCourses,
                flashcardChangedAny,
                false),
            courseCount: Object.keys(tracks).length,
            moduleCount,
            domainCount: 0,
        }
    }

    /**
     * Assembles a full {@link SeedConfig} from the resolved course tracks.
     *
     * Standalone domains stay off except `foundations`, which the `customScope`
     * block can opt in; on a partial sync `reIndex` is forced false so unchanged
     * ES data is never wiped.
     *
     * @param tracks - Seed course tracks keyed by displayId
     * @param syncCourses - Sync course tracks keyed by displayId
     * @param flashcardEnabled - Whether the flashcard pass should run
     * @param foundationsEnabled - Whether to seed + sync the standalone foundations domain
     * @returns The full seed config
     */
    private assemble(
        tracks: Record<string, SeedCourseTrack>,
        syncCourses: Record<string, SeedSyncCourseTrack>,
        flashcardEnabled: boolean,
        foundationsEnabled: boolean,
    ): SeedConfig {
        return {
            seeders: {
                enabled: true,
                courses: {
                    enabled: true,
                    tracks,
                    flashcard: {
                        enabled: flashcardEnabled,
                        linkContents: false,
                    },
                },
                cv: false,
                // foundations domain seeds only when the customScope opts in
                foundations: foundationsEnabled,
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
                // mirror the seed toggle so the synced foundations land on CDN + ES
                foundations: foundationsEnabled,
                headhunting: false,
                // mirror the flashcard seed toggle so decks land in their ES search index
                flashcards: flashcardEnabled,
                // coding problems sync mirrors their (currently off) seeder toggle; flip
                // both on to populate the `coding-problems-*` search/autocomplete index
                codingProblems: false,
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
