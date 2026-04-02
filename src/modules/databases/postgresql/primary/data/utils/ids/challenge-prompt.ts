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

export interface BuildChallengePromptIdParams {
    courseId: CourseId
    moduleIndex: number
    challengeIndex: number
    promptIndex: number
}

export const buildChallengePromptId = (params: BuildChallengePromptIdParams) => {
    return uuidv5(
        `${buildChallengeId({
            courseId: params.courseId,
            moduleIndex: params.moduleIndex,
            challengeIndex: params.challengeIndex,
        })}-prompt-${params.promptIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}
