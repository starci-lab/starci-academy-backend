import {
    v5 as uuidv5,
} from "uuid"
import type {
    CourseId,
} from "./course-id"
import {
    COURSE_UUID_NAMESPACE,
} from "./namespace"
import {
    buildChallengeId,
} from "./challenge"

export interface BuildChallengeStepIdParams {
    courseId: CourseId
    moduleIndex: number
    challengeIndex: number
    stepIndex: number
}

export const buildChallengeStepId = (params: BuildChallengeStepIdParams) => {
    return uuidv5(
        `${buildChallengeId({
            courseId: params.courseId,
            moduleIndex: params.moduleIndex,
            challengeIndex: params.challengeIndex,
        })}-step-${params.stepIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}
