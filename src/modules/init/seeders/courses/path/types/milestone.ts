/**
 * Params for listing milestone folder indices under `milestones/`.
 */
export interface MilestonePathsParams {
    /** The relative path to the course. */
    courseRelativePath: string
}

/**
 * Params for listing milestone-task folder indices under `milestones/{milestone}/tasks/`.
 */
export interface MilestoneTaskPathsParams {
    /** The relative path to the milestone. */
    milestoneRelativePath: string
}
