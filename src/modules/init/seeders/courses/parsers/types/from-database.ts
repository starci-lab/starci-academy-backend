/**
 * Ordinals for {@link CourseParserService.courseFromDatabase}.
 */
export interface CourseFromDatabaseParams {
    /** Course ordinal on the mount. */
    courseIndex: number
}

/**
 * Ordinals for {@link ModuleParserService.modulesFromDatabase}.
 */
export interface ModulesFromDatabaseParams {
    /** Course ordinal on the mount. */
    courseIndex: number
}

/**
 * Ordinals for {@link ContentParserService.contentsFromDatabase}.
 */
export interface ContentsFromDatabaseParams {
    /** Course ordinal on the mount. */
    courseIndex: number
    /** Module ordinal within the course. */
    moduleIndex: number
}

/**
 * Ordinals for {@link ChallengeParserService.challengesFromDatabase}.
 */
export interface ChallengesFromDatabaseParams {
    /** Course ordinal on the mount. */
    courseIndex: number
    /** Module ordinal within the course. */
    moduleIndex: number
    /** Content ordinal within the module. */
    contentIndex: number
}

/**
 * Ordinals for {@link MilestoneParserService.milestonesFromDatabase}.
 */
export interface MilestonesFromDatabaseParams {
    /** Course ordinal on the mount. */
    courseIndex: number
}

/**
 * Ordinals for {@link MilestoneTaskParserService.milestoneTasksFromDatabase}.
 */
export interface MilestoneTasksFromDatabaseParams {
    /** Course ordinal on the mount. */
    courseIndex: number
    /** Milestone ordinal within the course. */
    milestoneIndex: number
}

/**
 * Ordinals for {@link QuizDeckParserService.quizDecksFromDatabase}.
 */
export interface QuizDecksFromDatabaseParams {
    /** Course ordinal on the mount. */
    courseIndex: number
}
