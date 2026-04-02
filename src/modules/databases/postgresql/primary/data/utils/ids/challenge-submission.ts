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

export interface BuildChallengeSubmissionIdParams {
    courseId: CourseId
    moduleIndex: number
    challengeIndex: number
    submissionIndex: number
}

export const buildChallengeSubmissionId = (params: BuildChallengeSubmissionIdParams) => {
    return uuidv5(
        `${buildChallengeId({
            courseId: params.courseId,
            moduleIndex: params.moduleIndex,
            challengeIndex: params.challengeIndex,
        })}-submission-${params.submissionIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}
