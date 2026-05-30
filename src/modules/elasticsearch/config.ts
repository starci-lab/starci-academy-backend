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
} from "@modules/databases"

/**
 * Config map data.
 */
export interface ConfigMapData {
  /**
   * Indices.
   */
  indices: string;
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
    },
    [ChallengeEntity.name]: {
        indices: "challenges",
    },
    [ContentEntity.name]: {
        indices: "contents",
    },
    [ModuleEntity.name]: {
        indices: "modules",
    },
    [MilestoneEntity.name]: {
        indices: "milestones",
    },
    [MilestoneTaskEntity.name]: {
        indices: "milestone-tasks",
    },
    [FoundationEntity.name]: {
        indices: "foundations",
    },
    [FoundationCategoryEntity.name]: {
        indices: "foundation-categories",
    },
    [HeadhuntingCompanyEntity.name]: {
        indices: "headhunting-companies",
    },
    [ConsultantEntity.name]: {
        indices: "consultants",
    },
}
