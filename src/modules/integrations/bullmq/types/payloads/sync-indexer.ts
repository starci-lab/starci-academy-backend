import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
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
