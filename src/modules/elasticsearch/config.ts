import {
    CourseEntity,
    LessonVideoEntity,
    ChallengeEntity,
    ContentEntity,
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
    [LessonVideoEntity.name]: {
        indices: "lesson-videos",
    },
    [ChallengeEntity.name]: {
        indices: "challenges",
    },
    [ContentEntity.name]: {
        indices: "contents",
    },
}
