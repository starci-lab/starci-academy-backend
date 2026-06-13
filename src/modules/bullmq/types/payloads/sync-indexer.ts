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
