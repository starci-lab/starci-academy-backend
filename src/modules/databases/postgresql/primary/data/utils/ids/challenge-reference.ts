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

export interface BuildChallengeReferenceIdParams {
    courseId: CourseId
    moduleIndex: number
    challengeIndex: number
    referenceIndex: number
}

export const buildChallengeReferenceId = (params: BuildChallengeReferenceIdParams) => {
    return uuidv5(
        `${buildChallengeId({
            courseId: params.courseId,
            moduleIndex: params.moduleIndex,
            challengeIndex: params.challengeIndex,
        })}-reference-${params.referenceIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}
