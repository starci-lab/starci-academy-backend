import {
    ChallengeEntity,
    ContentEntity,
    FoundationCategoryEntity,
    CourseEntity,
    ModuleEntity,
    HeadhuntingCompanyEntity,
    ConsultantEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    FlashcardDeckEntity,
    CodingProblemEntity,
    UserEntity,
} from "@modules/databases"
import type {
    ElasticsearchIndexMapping,
} from "./types"
import {
    challengeIndexMapping,
} from "./challenge.mapping"
import {
    contentsIndexMapping,
} from "./contents.mapping"
import {
    foundationCategoryIndexMapping,
} from "./foundation-category.mapping"
import {
    coursesIndexMapping,
} from "./courses.mapping"
import {
    modulesIndexMapping,
} from "./modules.mapping"
import {
    headhuntingCompaniesIndexMapping,
} from "./headhunting-companies.mapping"
import {
    consultantsIndexMapping,
} from "./consultants.mapping"
import {
    milestonesIndexMapping,
} from "./milestones.mapping"
import {
    milestoneTasksIndexMapping,
} from "./milestone-tasks.mapping"
import {
    flashcardDecksIndexMapping,
} from "./flashcard-deck.mapping"
import {
    codingProblemsIndexMapping,
} from "./coding-problem.mapping"
import {
    userIndexMapping,
} from "./user.mapping"

export * from "./types"

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
