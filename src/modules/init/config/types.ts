/**
 * Where a reindexed ES index forces a full ES resync (so a dropped index never
 * stays empty). Each value is a sync knob the parser flips to "full":
 *
 * - `courseRoot` -- the course catalog root entity.
 * - `modules` -- module + content + challenge indices (course module track).
 * - `milestones` -- milestone + milestone-task indices (course milestone track).
 * - `foundations` -- the standalone foundations domain.
 * - `headhunting` -- the standalone headhunting companies/consultants domain.
 * - `flashcards` -- the global flashcard-deck domain.
 * - `codingProblems` -- the standalone coding-practice problems domain.
 */
export type ResyncTarget =
    | "courseRoot"
    | "modules"
    | "milestones"
    | "foundations"
    | "headhunting"
    | "flashcards"
    | "codingProblems"

/** One ES index's metadata: its entity class name + the resync target it belongs to. */
export interface IndexMeta {
    /** Entity class name -- the key the reset service / `configMap` use. */
    entity: string
    /** The sync knob to force to full when this index is reindexed. */
    resync: ResyncTarget
}
