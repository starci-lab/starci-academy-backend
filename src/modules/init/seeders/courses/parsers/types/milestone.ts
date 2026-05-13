import {
    ResolvedFilePath,
} from "../../path"

/** Ordinals locating `milestones/{milestoneIndex}-{slug}/` on the course mount. */
export interface ParseMilestoneParams {
    /** The paths of the milestone. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The index of the milestone. */
    milestoneIndex: number
}

/** Ordinals locating `milestones/` on the course mount. */
export interface ParseMilestoneManyParams {
    /** The relative path of the course. */
    courseRelativePath: string
    /** The index of the course. */
    courseIndex: number
}

/** Ordinals locating `milestones/{milestone}/tasks/{taskIndex}-{slug}/` on the course mount. */
export interface ParseMilestoneTaskParams {
    /** The paths of the task. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The index of the milestone. */
    milestoneIndex: number
    /** The index of the task. */
    taskIndex: number
}

/** Ordinals locating `milestones/{milestone}/tasks/` on the course mount. */
export interface ParseMilestoneTaskManyParams {
    /** The relative path of the milestone. */
    milestoneRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The index of the milestone. */
    milestoneIndex: number
}

