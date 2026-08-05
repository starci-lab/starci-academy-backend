import type {
    SeedConfig,
} from "@modules/filesystem/types/seed"

/**
 * Standalone seed domains that map 1:1 to `SeedSeedersConfig` boolean flags.
 *
 * Each value is the exact `seed.yaml` `seeders.<key>` / `synchronizers.<key>`
 * flag name, so a changed top-level repo folder can be gated directly.
 */
export type DataGitDomain =
    | "cv"
    | "foundations"
    | "headhunting"
    | "aiModels"
    | "subscriptions"
    | "codingProblems"

/**
 * Structured view of a data-repo diff, keyed for narrowing the seed/sync scope.
 *
 * Produced from the raw changed-path list; consumed by the overlay builder.
 */
export interface DataGitDiff {
    /**
     * True when the diff cannot be safely scoped (unclassifiable path, etc.) and
     * the caller must fall back to a full reseed instead of narrowing.
     */
    fullReseed: boolean
    /** Changed module order-indexes per course `displayId`. */
    moduleIndicesByCourse: Map<string, Set<number>>
    /** Changed milestone order-indexes per course `displayId`. */
    milestoneIndicesByCourse: Map<string, Set<number>>
    /** Course `displayId`s whose root files (en.md/vi.md/master_plan.md) changed. */
    courseRootChanged: Set<string>
    /** Course `displayId`s whose `flashcard-decks/` changed. */
    flashcardChangedCourses: Set<string>
    /** Standalone domains whose top-level folder changed. */
    changedDomains: Set<DataGitDomain>
}

/** Result of building a narrowed `seed.yaml` overlay from a diff. */
export interface BuildDiffOverlayResult {
    /**
     * Narrowed seed config to apply via `setRuntimeSeedConfig`, or `null` when a
     * full reseed is required (no override should be applied).
     */
    overlay: SeedConfig | null
    /** Number of courses kept in the narrowed scope. */
    courseCount: number
    /** Total module order-indexes kept across all courses. */
    moduleCount: number
    /** Number of standalone domains kept enabled. */
    domainCount: number
}
