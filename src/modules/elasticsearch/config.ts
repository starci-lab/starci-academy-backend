import {
    CourseEntity,
    ChallengeEntity,
    ContentEntity,
    ModuleEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    FoundationEntity,
    FoundationCategoryEntity,
    ConsultantEntity,
    HeadhuntingCompanyEntity,
    FlashcardDeckEntity,
    CodingProblemEntity,
} from "@modules/databases"
import type {
    ElasticsearchIndexMapping,
} from "./mappings"
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

/**
 * Config map data.
 */
export interface ConfigMapData {
  /**
   * Indices.
   */
  indices: string;
  /**
   * Explicit index mapping (settings + mappings) used when an index is reset. Holds the unified
   * V1+V2 field shape — both legacy (`body`) and SCHEMA V2 (`bodies`, `isPremium`, `verified`)
   * fields live in the same record/index. Omitted → the index is reset with dynamic mapping.
   */
  mapping?: ElasticsearchIndexMapping;
}

/**
 * Config map.
 */
export type ConfigMap = Record<string, ConfigMapData>;

/**
 * Config map.
 */
export const configMap: ConfigMap = {
    [CourseEntity.name]: {
        indices: "courses",
        mapping: coursesIndexMapping,
    },
    [ChallengeEntity.name]: {
        indices: "challenges",
        mapping: challengeIndexMapping,
    },
    [ContentEntity.name]: {
        indices: "contents",
        mapping: contentsIndexMapping,
    },
    [ModuleEntity.name]: {
        indices: "modules",
        mapping: modulesIndexMapping,
    },
    [MilestoneEntity.name]: {
        indices: "milestones",
        mapping: milestonesIndexMapping,
    },
    [MilestoneTaskEntity.name]: {
        indices: "milestone-tasks",
        mapping: milestoneTasksIndexMapping,
    },
    [FoundationEntity.name]: {
        indices: "foundations",
    },
    [FoundationCategoryEntity.name]: {
        indices: "foundation-categories",
        mapping: foundationCategoryIndexMapping,
    },
    [HeadhuntingCompanyEntity.name]: {
        indices: "headhunting-companies",
        mapping: headhuntingCompaniesIndexMapping,
    },
    [ConsultantEntity.name]: {
        indices: "consultants",
        mapping: consultantsIndexMapping,
    },
    [FlashcardDeckEntity.name]: {
        indices: "flashcard-decks",
        mapping: flashcardDecksIndexMapping,
    },
    [CodingProblemEntity.name]: {
        indices: "coding-problems",
        mapping: codingProblemsIndexMapping,
    },
}
