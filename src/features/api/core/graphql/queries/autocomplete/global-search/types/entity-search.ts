import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
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
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"

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
