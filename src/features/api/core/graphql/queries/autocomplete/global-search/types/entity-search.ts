import type {
    Locale,
} from "@modules/databases"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    ModuleEntity,
    FlashcardDeckEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    FoundationEntity,
} from "@modules/databases"

/**
 * Shared args every per-entity global-searcher receives. `size` is the per-kind
 * cap (not a global total) so one noisy index cannot starve the others.
 */
export interface EntitySearchParams {
    term: string
    size: number
    locale: Locale
}

/**
 * Entity class names that global search may query. The string is `Entity.name`
 * so a typo fails at compile time instead of silently searching the wrong ES index.
 */
export type SearchableEntity =
    typeof CourseEntity.name |
    typeof ModuleEntity.name |
    typeof ChallengeEntity.name |
    typeof ContentEntity.name |
    typeof FlashcardDeckEntity.name |
    typeof MilestoneEntity.name |
    typeof MilestoneTaskEntity.name |
    typeof FoundationEntity.name
