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
    /** Technical (course-scoped) mock-interview question seeding. */
    interviewQuestions: boolean
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
    advertisements: boolean
    changelog: boolean
    blog: boolean
    achievements: boolean
    /** Behavioral (global, non-course-scoped) EQ mock-interview question seeding. */
    mockInterviewEq: boolean
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

/**
 * Per-sink toggle for a standalone domain (foundations, headhunting, …). Only the
 * `elasticsearch` sink is wired today (the CDN synchronizer has no domain kinds), but
 * the shape mirrors the per-sink course tracks so the schema stays symmetric.
 */
export interface SeedSyncDomainSink {
    /** Sync this domain's documents to CDN (currently inert — no CDN domain sync). */
    cdn: boolean
    /** Sync this domain's documents to the Elasticsearch search/autocomplete index. */
    elasticsearch: boolean
}

/** Phase 2 — synchronizers (PostgreSQL -> CDN + Elasticsearch). */
export interface SeedSynchronizersConfig {
    /** Master switch for the whole sync phase. */
    enabled: boolean
    /**
     * Entity class names whose Elasticsearch index is DROPPED + re-created (from its
     * mapping) before this sync repopulates it. Empty = incremental upsert only.
     * Resolved from the friendly `sync.reindex` names via `configMap`.
     */
    reindex: Array<string>
    /** Per-course scopes, keyed by course `displayId`. */
    courses: Record<string, SeedSyncCourseTrack>
    /** Standalone domains — per-sink (only `elasticsearch` is wired today). */
    cv: SeedSyncDomainSink
    foundations: SeedSyncDomainSink
    headhunting: SeedSyncDomainSink
    /** Sync flashcard decks to Elasticsearch (search + title autocomplete). */
    flashcards: SeedSyncDomainSink
    /** Sync coding-practice problems to Elasticsearch (search + title autocomplete). */
    codingProblems: SeedSyncDomainSink
}

/**
 * Full seed/sync control config.
 *
 * In git-init mode this is built in-memory by the diff overlay from `seed.yaml`
 * and applied via `setRuntimeSeedConfig`; nothing reads it off disk directly.
 */
export interface SeedConfig {
    seeders: SeedSeedersConfig
    synchronizers: SeedSynchronizersConfig
}

/**
 * Coarse init mode (`seed.yaml` `mode`), used as a fallback ONLY when neither the
 * `seed:` nor `sync:` block is present.
 *
 * - `"all"`  → full reseed/sync of every course (ignores the diff).
 * - `"diff"` → default: seed/sync only the changed courses/modules.
 * - `"none"` → skip both phases (no-op boot).
 */
export type InitScopeMode = "all" | "diff" | "none"

// ─────────────────────────────────────────────────────────────────────────────
// seed.yaml INPUT schema (`InitConfig`) — friendly, shorthand-rich surface that
// the parser expands into the runtime `SeedConfig` above.
// ─────────────────────────────────────────────────────────────────────────────

/** `sync.reindex`: which ES indices to DROP + re-create first. Friendly index names. */
export type ReindexScope = "all" | "none" | Array<string>

/**
 * One `seed.courses` entry: a shorthand module scope, or a per-track object.
 * Shorthand (`all`/range/list) → modules scope; milestones/flashcards default off.
 */
export type InitSeedCourseValue = SeedScopeIndexes | {
    /** Module/contents track scope. */
    modules?: SeedScopeIndexes
    /** Milestone track scope — `true` = all, `false`/`[]` = off, or an index scope. */
    milestones?: SeedScopeIndexes | boolean
    /** Seed this course's flashcard decks. */
    flashcards?: boolean
    /** Seed this course's technical mock-interview questions. */
    interviewQuestions?: boolean
}

/** Phase 1 input — sources → PostgreSQL. Omit, or `enabled: false`, to skip seeding. */
export interface InitSeedBlock {
    enabled?: boolean
    courses?: Record<string, InitSeedCourseValue>
    foundations?: boolean
    codingProblems?: boolean
    aiModels?: boolean
    cv?: boolean
    headhunting?: boolean
    subscriptions?: boolean
    advertisements?: boolean
    changelog?: boolean
    blog?: boolean
    achievements?: boolean
    /** Seed behavioral (global) EQ mock-interview questions from `mock-interview-eq/`. */
    mockInterviewEq?: boolean
}

/** Per-sink scope value: a scope-indexes form, or a bool (`true` = all, `false` = off). */
export type InitSyncSinkScope = SeedScopeIndexes | boolean

/** One sync course track: a per-sink object, or a shorthand applied to every sink. */
export type InitSyncTrackValue = InitSyncSinkScope | {
    cdn?: InitSyncSinkScope
    elasticsearch?: InitSyncSinkScope
    repo?: InitSyncSinkScope
}

/** One `sync.courses` entry: shorthand (every sink/track), or per-track object. */
export type InitSyncCourseValue = InitSyncSinkScope | {
    modules?: InitSyncTrackValue
    milestones?: InitSyncTrackValue
}

/** One `sync.<domain>` entry: a bool, or a per-sink object. */
export type InitSyncDomainValue = boolean | {
    cdn?: boolean
    elasticsearch?: boolean
}

/** Phase 2 input — PostgreSQL → CDN/ES/repo. Omit, or `enabled: false`, to skip syncing. */
export interface InitSyncBlock {
    enabled?: boolean
    /** DROP + re-create these ES indices before syncing (auto-forces their ES sync to full). */
    reindex?: ReindexScope
    /** Hard master per sink — a `false` sink zeros that sink across every course/domain. */
    sinks?: {
        cdn?: boolean
        elasticsearch?: boolean
        repo?: boolean
    }
    courses?: Record<string, InitSyncCourseValue>
    foundations?: InitSyncDomainValue
    codingProblems?: InitSyncDomainValue
    flashcards?: InitSyncDomainValue
    headhunting?: InitSyncDomainValue
    cv?: InitSyncDomainValue
}

/**
 * Parsed shape of `seed.yaml`. The `seed:`/`sync:` blocks take precedence; when both
 * are absent the coarse `mode` decides (all/diff/none). Expanded into a {@link SeedConfig}
 * by the init-config parser.
 */
export interface InitConfig {
    /**
     * Master switch. `false` skips the ENTIRE init at boot — no git pull, no seed,
     * no sync (fastest local start). Defaults to `true` (omitted = enabled).
     */
    enable?: boolean
    mode?: InitScopeMode
    seed?: InitSeedBlock
    sync?: InitSyncBlock
}
