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
    buildModuleId,
} from "./module"

export interface BuildChallengeIdParams {
    courseId: CourseId
    moduleIndex: number
    challengeIndex: number
}

export const buildChallengeId = (params: BuildChallengeIdParams) => {
    return uuidv5(
        `${buildModuleId(params)}-challenge-${params.challengeIndex}`,
        COURSE_UUID_NAMESPACE,
    )
}
