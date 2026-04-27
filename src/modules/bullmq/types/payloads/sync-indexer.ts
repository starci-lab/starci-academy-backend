import { 
    CourseEntity, 
    ChallengeEntity, 
    ContentEntity, 
    LessonVideoEntity, 
    ModuleEntity 
} from "@modules/databases"
import type {
    Dayjs,
} from "dayjs"

export type SyncIndexerEntityKind =
    typeof CourseEntity.name
    | typeof ChallengeEntity.name
    | typeof ContentEntity.name
    | typeof LessonVideoEntity.name
    | typeof ModuleEntity.name
/**
 * Primes the parent-index cache by scanning entities and storing small parent refs.
 */
export interface SyncIndexerPayload {
    /** Timestamp of the sync. */
    syncAt: Dayjs
    /** What entity type(s) to process. */
    entityKind: SyncIndexerEntityKind
}

