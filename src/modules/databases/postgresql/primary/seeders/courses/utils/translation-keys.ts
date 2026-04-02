import type {
    ChallengeInputTranslationEntity,
    ChallengeReferenceTranslationEntity,
    ChallengeSubmissionTranslationEntity,
    ChallengeStepTranslationEntity,
    ChallengeTranslationEntity,
    ContentReferenceTranslationEntity,
    ContentTranslationEntity,
    CourseTranslationEntity,
    LessonVideoTranslationEntity,
    ModuleTranslationEntity,
    PreviewContentTranslationEntity,
    PrerequisiteTranslationEntity,
    QnaTranslationEntity,
    ValuePropositionTranslationEntity,
} from "@modules/databases"

/**
 * The key for the content translation.
 */
export const contentTranslationKey = (
    t: Pick<ContentTranslationEntity, "contentId" | "locale" | "field">,
): string => {
    return `${t.contentId}:${t.locale}:${t.field}`
}

/**
 * The key for a content reference translation row.
 */
export const contentReferenceTranslationKey = (
    t: Pick<ContentReferenceTranslationEntity, "contentReferenceId" | "locale" | "field">,
): string => {
    return `${t.contentReferenceId}:${t.locale}:${t.field}`
}

export const challengeTranslationKey = (
    t: Pick<ChallengeTranslationEntity, "challengeId" | "locale" | "field">,
): string => {
    return `${t.challengeId}:${t.locale}:${t.field}`
}

export const challengeInputTranslationKey = (
    t: Pick<ChallengeInputTranslationEntity, "challengeInputId" | "locale" | "field">,
): string => {
    return `${t.challengeInputId}:${t.locale}:${t.field}`
}

export const challengeStepTranslationKey = (
    t: Pick<ChallengeStepTranslationEntity, "challengeStepId" | "locale" | "field">,
): string => {
    return `${t.challengeStepId}:${t.locale}:${t.field}`
}

export const challengeReferenceTranslationKey = (
    t: Pick<ChallengeReferenceTranslationEntity, "challengeReferenceId" | "locale" | "field">,
): string => {
    return `${t.challengeReferenceId}:${t.locale}:${t.field}`
}

export const challengeSubmissionTranslationKey = (
    t: Pick<ChallengeSubmissionTranslationEntity, "challengeSubmissionId" | "locale" | "field">,
): string => {
    return `${t.challengeSubmissionId}:${t.locale}:${t.field}`
}

/**
 * The key for the course translation.
 */
export const courseTranslationKey = (
    t: Pick<CourseTranslationEntity, "courseId" | "locale" | "field">,
): string => {
    return `${t.courseId}:${t.locale}:${t.field}`
}

/**
 * The key for the module translation.
 */
export const moduleTranslationKey = (
    t: Pick<ModuleTranslationEntity, "moduleId" | "locale" | "field">,
): string => {
    return `${t.moduleId}:${t.locale}:${t.field}`
}

/**
 * The key for the preview content translation.
 */
export const previewContentTranslationKey = (
    t: Pick<PreviewContentTranslationEntity, "previewContentId" | "locale" | "field">,
): string => {
    return `${t.previewContentId}:${t.locale}:${t.field}`
}

/**
 * The key for the lesson video translation.
 */
export const lessonVideoTranslationKey = (
    t: Pick<LessonVideoTranslationEntity, "lessonVideoId" | "locale" | "field">,
): string => {
    return `${t.lessonVideoId}:${t.locale}:${t.field}`
}

/**
 * The key for the prerequisite translation.
 */
export const prerequisiteTranslationKey = (
    t: Pick<PrerequisiteTranslationEntity, "prerequisiteId" | "locale" | "field">,
): string => {
    return `${t.prerequisiteId}:${t.locale}:${t.field}`
}

/**
 * The key for the qna translation.
 */
export const qnaTranslationKey = (
    t: Pick<QnaTranslationEntity, "qnaId" | "locale" | "field">,
): string => {
    return `${t.qnaId}:${t.locale}:${t.field}`
}

/**
 * The key for the value proposition translation.
 */
export const valuePropositionTranslationKey = (
    t: Pick<ValuePropositionTranslationEntity, "valuePropositionId" | "locale" | "field">,
): string => {
    return `${t.valuePropositionId}:${t.locale}:${t.field}`
}
