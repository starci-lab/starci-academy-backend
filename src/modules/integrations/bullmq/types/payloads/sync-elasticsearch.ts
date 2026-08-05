import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
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
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    Dayjs
} from "dayjs"

/** Entity kinds supported by on-demand Elasticsearch sync (search indices). */
export type SyncElasticsearchEntityKind =
    typeof CourseEntity.name
    | typeof ChallengeEntity.name
    | typeof ContentEntity.name
    | typeof ModuleEntity.name
    | typeof MilestoneEntity.name
    | typeof MilestoneTaskEntity.name
    | typeof FoundationEntity.name
    | typeof FoundationCategoryEntity.name
    | typeof ConsultantEntity.name
    | typeof HeadhuntingCompanyEntity.name
    | typeof FlashcardDeckEntity.name
    | typeof CodingProblemEntity.name

/** Payload for a sync-elasticsearch BullMQ job (one entity by id). */
export interface SyncElasticsearchPayload {
    /** Entity kind that determines which runtime sync service to invoke. */
    entityKind: SyncElasticsearchEntityKind
    /** The timestamp of the sync. */
    syncAt: Dayjs
}
