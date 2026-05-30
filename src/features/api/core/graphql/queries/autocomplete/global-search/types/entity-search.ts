import type {
    Locale,
} from "@modules/databases"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    ModuleEntity,
} from "@modules/databases"

export interface EntitySearchParams {
    term: string
    size: number
    locale: Locale
}

export type SearchableEntity =
    typeof CourseEntity.name |
    typeof ModuleEntity.name |
    typeof ChallengeEntity.name |
    typeof ContentEntity.name
