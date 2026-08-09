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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
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
   * V1+V2 field shape -- both legacy (`body`) and SCHEMA V2 (`bodies`, `isPremium`, `verified`)
   * fields live in the same record/index. Omitted -> the index is reset with dynamic mapping.
   */
  mapping?: ElasticsearchIndexMapping;
  /**
   * Whether documents are fanned out into per-locale indices (`<base>-<locale>`). Defaults to
   * `true` -- every content entity is localized. `users` is the one non-localized index, so it must
   * NOT get `users-en` / `users-vi` variants created for it.
   */
  localized?: boolean;
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
    // non-localized user index (search + "who to follow") -- written by es-sync,
    // NOT by the per-locale content synchronizer, so it never gets locale variants
    [UserEntity.name]: {
        indices: "users",
        mapping: userIndexMapping,
        localized: false,
    },
}

/**
 * Resolve every concrete index variant an entity owns: the base index plus, for localized
 * entities, one index per {@link Locale}.
 *
 * Boot-time index creation and index resets both walk this list, so a new locale (or a new entity)
 * can never end up with an index that was auto-created by its first document instead of being
 * created from its declared mapping.
 *
 * @param entity - Entity class name (key into {@link configMap}).
 * @returns Locales selecting each concrete index; `undefined` selects the base index.
 *
 * @example
 * resolveIndexLocales(CourseEntity.name) // [undefined, Locale.En, Locale.Vi]
 */
export function resolveIndexLocales(
    entity: string,
): Array<Locale | undefined> {
    // a non-localized entity owns exactly one index: the base one
    if (configMap[entity]?.localized === false) {
        return [undefined]
    }
    return [undefined,
        ...Object.values(Locale)]
}
