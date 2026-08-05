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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import type {
    ElasticsearchIndexMapping,
} from "./mappings/types"
import {
    challengeIndexMapping,
} from "./mappings/challenge.mapping"
import {
    contentsIndexMapping,
} from "./mappings/contents.mapping"
import {
    foundationCategoryIndexMapping,
} from "./mappings/foundation-category.mapping"
import {
    coursesIndexMapping,
} from "./mappings/courses.mapping"
import {
    modulesIndexMapping,
} from "./mappings/modules.mapping"
import {
    headhuntingCompaniesIndexMapping,
} from "./mappings/headhunting-companies.mapping"
import {
    consultantsIndexMapping,
} from "./mappings/consultants.mapping"
import {
    milestonesIndexMapping,
} from "./mappings/milestones.mapping"
import {
    milestoneTasksIndexMapping,
} from "./mappings/milestone-tasks.mapping"
import {
    flashcardDecksIndexMapping,
} from "./mappings/flashcard-deck.mapping"
import {
    codingProblemsIndexMapping,
} from "./mappings/coding-problem.mapping"
import {
    userIndexMapping,
} from "./mappings/user.mapping"

export * from "./mappings/types"

/**
 * Registry of index mappings keyed by entity name (`Entity.name`). Add an entry here to give an
 * index an explicit mapping; entities without an entry keep Elasticsearch's dynamic mapping.
 */
const elasticsearchIndexMappings: Record<string, ElasticsearchIndexMapping> = {
    [ChallengeEntity.name]: challengeIndexMapping,
    [ContentEntity.name]: contentsIndexMapping,
    [FoundationCategoryEntity.name]: foundationCategoryIndexMapping,
    [CourseEntity.name]: coursesIndexMapping,
    [ModuleEntity.name]: modulesIndexMapping,
    [HeadhuntingCompanyEntity.name]: headhuntingCompaniesIndexMapping,
    [ConsultantEntity.name]: consultantsIndexMapping,
    [MilestoneEntity.name]: milestonesIndexMapping,
    [MilestoneTaskEntity.name]: milestoneTasksIndexMapping,
    [FlashcardDeckEntity.name]: flashcardDecksIndexMapping,
    [CodingProblemEntity.name]: codingProblemsIndexMapping,
    [UserEntity.name]: userIndexMapping,
}

/**
 * Resolve the index mapping for an entity, or `undefined` when none is registered.
 *
 * @param entity - Entity name (`Entity.name`).
 * @returns The mapping (settings + mappings) or `undefined`.
 */
export function resolveElasticsearchIndexMapping(
    entity: string,
): ElasticsearchIndexMapping | undefined {
    return elasticsearchIndexMappings[entity]
}
