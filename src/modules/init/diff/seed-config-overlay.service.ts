import {
    Injectable,
} from "@nestjs/common"
import {
    type SeedConfig,
    type SeedCourseTrack,
    type SeedSyncCourseTrack,
    type SeedSyncDomainSink,
} from "@modules/filesystem"
import type {
    BuildDiffOverlayResult,
    DataGitDiff,
    DataGitDomain,
    DomainFlags,
} from "./types"

/** All-off domain flags — the baseline every builder starts from. */
const NO_DOMAINS: DomainFlags = {
    flashcard: false,
    foundations: false,
    cv: false,
    headhunting: false,
    aiModels: false,
    subscriptions: false,
    codingProblems: false,
}

@Injectable()
/**
 * Builds the full {@link SeedConfig} the existing pipeline understands.
 *
 * The seed scope is always diff-based: the changed set drives a narrowed
 * overlay, while a first pull / untrustable diff promotes to a full reseed of
 * every course discovered under the active root. Applied via
 * `setRuntimeSeedConfig`, so the shared pipeline scopes itself with no
 * shared-code edits.
 */
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
        // coarse full reseed: standalone domains stay off (toggled only via the
        // explicit seed:/sync: blocks or the diff path)
        return this.assemble(tracks,
            syncCourses,
            NO_DOMAINS)
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
        // changed standalone domains (foundations, cv, headhunting, coding-problems,
        // ai-models, subscriptions) re-seed/sync too — otherwise a domain-only edit
        // would resolve to an empty overlay and silently seed nothing
        const domains = this.domainFlagsFromDiff(diff.changedDomains,
            flashcardChangedAny)
        return {
            // diff is a narrow incremental sync — never reIndex (would drop every
            // index but only repopulate the changed subset, wiping out-of-scope data)
            overlay: this.assemble(tracks,
                syncCourses,
                domains),
            courseCount: Object.keys(tracks).length,
            moduleCount,
            domainCount: diff.changedDomains.size,
        }
    }

    /**
     * Maps the diff's changed-domain set onto the {@link DomainFlags} the overlay
     * understands, carrying the (separately computed) global flashcard toggle.
     *
     * @param changedDomains - Standalone domains touched by the diff
     * @param flashcard - Whether any course's flashcard decks changed
     * @returns The resolved domain flags
     */
    private domainFlagsFromDiff(
        changedDomains: Set<DataGitDomain>,
        flashcard: boolean,
    ): DomainFlags {
        return {
            flashcard,
            foundations: changedDomains.has("foundations"),
            cv: changedDomains.has("cv"),
            headhunting: changedDomains.has("headhunting"),
            aiModels: changedDomains.has("aiModels"),
            subscriptions: changedDomains.has("subscriptions"),
            codingProblems: changedDomains.has("codingProblems"),
        }
    }

    /**
     * Assembles a full {@link SeedConfig} from the resolved course tracks + the
     * standalone-domain flags.
     *
     * The course pipeline is always enabled; each standalone domain seeds/syncs
     * only when its {@link DomainFlags} bit is set. The coarse full/diff paths never
     * reindex (`synchronizers.reindex: []`) — only the explicit `sync.reindex` block
     * drops indices. Note `aiModels` and `subscriptions` are seed-only catalogs.
     *
     * @param tracks - Seed course tracks keyed by displayId
     * @param syncCourses - Sync course tracks keyed by displayId
     * @param domains - Standalone-domain + flashcard toggles
     * @returns The full seed config
     */
    private assemble(
        tracks: Record<string, SeedCourseTrack>,
        syncCourses: Record<string, SeedSyncCourseTrack>,
        domains: DomainFlags,
    ): SeedConfig {
        return {
            seeders: {
                enabled: true,
                courses: {
                    enabled: true,
                    tracks,
                    flashcard: {
                        enabled: domains.flashcard,
                    },
                    // diff/full-reseed auto-detection doesn't track mock-interview bank
                    // changes yet (no `DataGitDomain`/`DomainFlags` wiring) — only the
                    // explicit `seed.courses.<course>.interview` block (via
                    // `InitConfigParserService`) can turn this on today.
                    interview: {
                        enabled: false,
                    },
                },
                cv: domains.cv,
                foundations: domains.foundations,
                headhunting: domains.headhunting,
                aiModels: domains.aiModels,
                subscriptions: domains.subscriptions,
                codingProblems: domains.codingProblems,
                advertisements: false,
                changelog: false,
                blog: false,
                achievements: false,
                // the diff pipeline has no behavioral-question change detection either
                // (this bank is global, not per-course) — never auto-enabled by a diff sync
                mockInterviewEq: false,
            },
            synchronizers: {
                enabled: true,
                // coarse full/diff never drops indices — explicit sync.reindex does
                reindex: [],
                courses: syncCourses,
                cv: this.domainSink(domains.cv),
                // mirror each seed toggle so the synced data lands on its sinks
                foundations: this.domainSink(domains.foundations),
                headhunting: this.domainSink(domains.headhunting),
                // mirror the flashcard seed toggle so decks land in their ES search index
                flashcards: this.domainSink(domains.flashcard),
                // coding problems sync mirrors its seeder toggle to populate the
                // `coding-problems-*` search/autocomplete index
                codingProblems: this.domainSink(domains.codingProblems),
            },
        }
    }

    /** Map a single domain on/off flag to a per-sink sink config (CDN inert for domains). */
    private domainSink(enabled: boolean): SeedSyncDomainSink {
        return {
            cdn: enabled,
            elasticsearch: enabled,
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
