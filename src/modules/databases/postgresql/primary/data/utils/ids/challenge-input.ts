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

export interface BuildChallengeInputIdParams {
    courseId: CourseId
    moduleIndex: number
    challengeIndex: number
    inputIndex: number
}

export const buildChallengeInputId = (params: BuildChallengeInputIdParams) => {
    return uuidv5(
        `${buildChallengeId({
            courseId: params.courseId,
            moduleIndex: params.moduleIndex,
            challengeIndex: params.challengeIndex,
        })}-input-${params.inputIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}
