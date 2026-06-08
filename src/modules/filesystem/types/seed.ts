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

/** Per-course seed scope (one entry under `seeders.courses.tracks`). */
export interface SeedCourseTrack {
    /** Seed/refresh the course root entity itself (title, slug, catalog row). */
    course: boolean
    /** Module track scope: modules -> contents -> challenges -> lessons. */
    modules: SeedScopeIndexes
    /** Milestone track scope: milestones -> milestone tasks. */
    milestones: SeedScopeIndexes
}

/** Quiz deck/card seeding toggles (runs inside the course pipeline). */
export interface SeedQuizConfig {
    /** When false, skip all quiz deck parsing/upsert. */
    enabled: boolean
    /** When true, resolve `# contents` links in deck markdown -> quiz_deck_contents. */
    linkContents: boolean
}

/** Course pipeline seed config (`seeders.courses`). */
export interface SeedCoursesConfig {
    /** Master switch for the whole course pipeline. */
    enabled: boolean
    /** Per-course scopes, keyed by course `displayId`. */
    tracks: Record<string, SeedCourseTrack>
    /** Quiz deck/card seeding. */
    quiz: SeedQuizConfig
}

/** Phase 1 — seeders (sources -> PostgreSQL). */
export interface SeedSeedersConfig {
    /** Master switch for the whole seed phase. */
    enabled: boolean
    /** Course pipeline (modules, contents, challenges, lessons, quiz, milestones). */
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
}

/** Root of the mounted `_seed.yaml`. */
export interface SeedConfig {
    seeders: SeedSeedersConfig
    synchronizers: SeedSynchronizersConfig
}

/**
 * Coarse init mode used when `scopeCustom` is absent.
 *
 * - `"all"`  → force a full reseed/sync of every course (ignores the diff, even
 *   when already on the remote SHA).
 * - `"diff"` → default: check remote vs local marker and seed/sync only the
 *   changed courses/modules (short-circuits when already up to date).
 * - `"none"` → skip the seed/sync phases entirely (no-op boot).
 */
export type InitScopeMode = "all" | "diff" | "none"

/**
 * Optional scope override for the git-sourced init (`seed.yaml`).
 *
 * When `scopeCustom` is present and non-empty, the git init seeds/syncs exactly
 * the listed courses/modules (instead of the diff-derived scope), then pulls the
 * source into `.contexts` as usual. Otherwise `scope` picks the coarse mode.
 */
export interface InitScopeConfig {
    /**
     * Custom course scope keyed by course displayId; the value scopes that
     * course's module track (`"all"`, `[1, 2, 3]`, or a range like `"0-19"`).
     * Takes precedence over `scope` when present and non-empty.
     */
    scopeCustom?: Record<string, SeedScopeIndexes>
    /**
     * Coarse mode used only when `scopeCustom` is absent/empty. Omit → `"diff"`.
     */
    scope?: InitScopeMode
}
