/**
 * Parsed shape of the mounted `seed.yaml` init-control file.
 *
 * Source of truth for what the boot-time init runs (seeders -> synchronizers)
 * and how far each phase is scoped. Replaces the old `envConfig().init` block.
 * See `.mount/config/seed.yaml` for the annotated reference file.
 */

/**
 * Scope value for a single course track (modules / milestones / a sync sink).
 *
 * Accepted forms (resolved by `parseScopeIndexes`):
 * - `"all"`            include every item in the track.
 * - `Array<number>`    allow-list of mount `orderIndex` values (e.g. `[0, 1]`).
 * - `string` range     `"1-5"`, `"0,2,4"`, or mixed `"1-3,7"` (inclusive ranges).
 * - `[]` / `""`        skip the whole track.
 */
export type SeedScopeIndexes = "all" | string | Array<number>

/**
 * Rich per-course override under `customScope.courses`, splitting each track out so a
 * course can scope its module/contents range while independently toggling the
 * milestone and flashcard-deck passes.
 *
 * Example:
 * ```yaml
 * fullstack-mastery:
 *   contents: "0-19"
 *   milestone: true
 *   flashcard-decks: true
 * ```
 */
export interface SeedCustomCourseScope {
    /** Module/contents track scope: `"all"`, an index list, or a range like `"0-19"`. */
    contents: SeedScopeIndexes
    /** When true, also seed/sync this course's milestone track (default false). */
    milestone?: boolean
    /**
     * When true, also seed this course's flashcard decks (default false). Kebab-cased
     * to mirror the `flashcard-decks/` mount folder; read via `value["flashcard-decks"]`.
     */
    "flashcard-decks"?: boolean
}

/**
 * Accepted value forms for one `customScope.courses` entry:
 * - {@link SeedScopeIndexes} — shorthand; scopes only the module/contents track
 *   (milestones + flashcard stay off). Backward-compatible with the old `"0-19"` form.
 * - {@link SeedCustomCourseScope} — rich object form toggling each track.
 */
export type SeedCustomCourseValue = SeedScopeIndexes | SeedCustomCourseScope

/** Normalized per-course custom scope after merging shorthand + object forms. */
export interface ResolvedCustomCourseScope {
    /** Resolved module/contents track scope. */
    contents: SeedScopeIndexes
    /** Whether the milestone track is enabled for this course. */
    milestone: boolean
    /** Whether flashcard-deck seeding is enabled for this course. */
    flashcardDecks: boolean
}

/** Per-course seed scope (one entry under `seeders.courses.tracks`). */
export interface SeedCourseTrack {
    /** Seed/refresh the course root entity itself (title, slug, catalog row). */
    course: boolean
    /** Module track scope: modules -> contents -> challenges -> lessons. */
    modules: SeedScopeIndexes
    /** Milestone track scope: milestones -> milestone tasks. */
    milestones: SeedScopeIndexes
}

/** Flashcard deck/card seeding toggles (runs inside the course pipeline). */
export interface SeedFlashcardConfig {
    /** When false, skip all flashcard deck parsing/upsert. */
    enabled: boolean
    /** When true, resolve `# contents` links in deck markdown -> flashcard_deck_contents. */
    linkContents: boolean
}

/** Course pipeline seed config (`seeders.courses`). */
export interface SeedCoursesConfig {
    /** Master switch for the whole course pipeline. */
    enabled: boolean
    /** Per-course scopes, keyed by course `displayId`. */
    tracks: Record<string, SeedCourseTrack>
    /** Flashcard deck/card seeding. */
    flashcard: SeedFlashcardConfig
}

/** Phase 1 — seeders (sources -> PostgreSQL). */
export interface SeedSeedersConfig {
    /** Master switch for the whole seed phase. */
    enabled: boolean
    /** Course pipeline (modules, contents, challenges, lessons, flashcard, milestones). */
    courses: SeedCoursesConfig
    /** Standalone domain seeders (simple on/off). */
    cv: boolean
    foundations: boolean
    headhunting: boolean
    aiModels: boolean
    subscriptions: boolean
    codingProblems: boolean
}

/** Independent CDN / Elasticsearch / Repo sink scopes for one course track. */
export interface SeedSyncCourseSink {
    /** CDN (S3 JSON) materialization scope. */
    cdn: SeedScopeIndexes
    /** Elasticsearch indexing scope. */
    elasticsearch: SeedScopeIndexes
    /**
     * Repo code sync scope — walks `.repo/` for matched modules and uploads
     * Sandpack file trees to CDN (`repo/{repoName}/{githubDir}.json`).
     */
    repo: SeedScopeIndexes
}

/** Per-course synchronizer scope (one entry under `synchronizers.courses`). */
export interface SeedSyncCourseTrack {
    /** Sync the course root entity itself (CDN JSON + Elasticsearch document). */
    course: boolean
    modules: SeedSyncCourseSink
    milestones: SeedSyncCourseSink
}

/** Phase 2 — synchronizers (PostgreSQL -> CDN + Elasticsearch). */
export interface SeedSynchronizersConfig {
    /** Master switch for the whole sync phase. */
    enabled: boolean
    /**
     * When true, DROP + re-create every Elasticsearch index (from its mapping)
     * before repopulating. When false, only upsert documents incrementally.
     */
    reIndex: boolean
    /** Per-course scopes, keyed by course `displayId`. */
    courses: Record<string, SeedSyncCourseTrack>
    /** Standalone domains (synced to both sinks; simple on/off). */
    cv: boolean
    foundations: boolean
    headhunting: boolean
    /** When true, sync flashcard decks to Elasticsearch (search + title autocomplete). */
    flashcards: boolean
    /** When true, sync coding-practice problems to Elasticsearch (search + title autocomplete). */
    codingProblems: boolean
}

/**
 * Full seed/sync control config.
 *
 * In git-init mode this is built in-memory by the diff overlay from `seed.yaml`
 * and applied via `setRuntimeSeedConfig` — there is no longer a `_seed.yaml`
 * disk file backing it.
 */
export interface SeedConfig {
    seeders: SeedSeedersConfig
    synchronizers: SeedSynchronizersConfig
}

/**
 * Coarse init mode used when `customScope` is absent.
 *
 * - `"all"`  → force a full reseed/sync of every course (ignores the diff, even
 *   when already on the remote SHA).
 * - `"diff"` → default: check remote vs local marker and seed/sync only the
 *   changed courses/modules (short-circuits when already up to date).
 * - `"none"` → skip the seed/sync phases entirely (no-op boot).
 */
export type InitScopeMode = "all" | "diff" | "none"

/**
 * Custom scope override for the git-sourced init (`seed.yaml` `customScope`).
 *
 * Split into independent sections so the per-course scope and the standalone
 * foundations domain are toggled separately.
 */
export interface InitCustomScope {
    /**
     * Per-course scope keyed by course displayId. Each value is either a shorthand
     * module scope (`"all"`, `[1, 2, 3]`, range `"0-19"`) or a rich
     * {@link SeedCustomCourseScope} object that also toggles the milestone and
     * flashcard-deck tracks.
     */
    courses?: Record<string, SeedCustomCourseValue>
    /**
     * When true, also seed (+ sync) the standalone foundations domain (categories
     * + foundation items + their thumbnails). Not tied to any course. Default false.
     */
    foundations?: boolean
}

/**
 * Optional scope override for the git-sourced init (`seed.yaml`).
 *
 * When `customScope` is present and non-empty (any course listed, or foundations
 * enabled), the git init seeds/syncs exactly that scope instead of the diff-derived
 * one, then pulls the source into `.contexts` as usual. Otherwise `scope` picks the
 * coarse mode.
 */
export interface InitScopeConfig {
    /**
     * Rich custom scope split into `courses` + `foundations`. Takes precedence over
     * `scope` when present and non-empty.
     */
    customScope?: InitCustomScope
    /**
     * Coarse mode used only when `customScope` is absent/empty. Omit → `"diff"`.
     */
    scope?: InitScopeMode
}
