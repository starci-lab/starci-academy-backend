import {
    CourseEntity,
    ChallengeEntity,
    ContentEntity,
    ModuleEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    FlashcardDeckEntity
} from "@modules/databases"
import type {
    Dayjs
} from "dayjs"

/**
 * Entity kinds the sync-indexer job will prime into parent-index cache.
 * Anything outside this union has no builder -- enqueueing it would no-op and
 * leave autocomplete/deep-links unresolved.
 */
export type SyncIndexerEntityKind =
    typeof CourseEntity.name
    | typeof ChallengeEntity.name
    | typeof ContentEntity.name
    | typeof ModuleEntity.name
    | typeof MilestoneEntity.name
    | typeof MilestoneTaskEntity.name
    | typeof FlashcardDeckEntity.name
/**
 * Primes the parent-index cache by scanning entities and storing small parent refs.
 */
export interface SyncIndexerPayload {
    /** Timestamp of the sync. */
    syncAt: Dayjs
    /** What entity type(s) to process. */
    entityKind: SyncIndexerEntityKind
}
