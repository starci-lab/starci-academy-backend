/**
 * Course ID builder.
 */
export enum CourseId {
    FullstackMastery = "fullstack-mastery",
}

/**
 * Parameters for building a module ID.
 */
export interface BuildModuleIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The module index.
     */
    moduleIndex: number
}
/**
 * Build a module ID.
 * @param params - The parameters for building the module ID.
 * @param params.courseId - The course ID.
 * @param params.moduleIndex - The module index.
 * @returns The module ID.
 */
export const buildModuleId = (params: BuildModuleIdParams) => {
    return `${params.courseId}-module-${params.moduleIndex}`
}

/**
 * Parameters for building a content ID.
 */
export interface BuildContentIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The module index.
     */
    moduleIndex: number
    /**
     * The content index.
     */
    contentIndex: number
}

/**
 * Build a content ID.
 * @param params - The parameters for building the content ID.
 * @param params.courseId - The course ID.
 * @param params.moduleIndex - The module index.
 * @param params.contentIndex - The content index.
 * @returns The content ID.
 */
export const buildContentId = (params: BuildContentIdParams) => {
    return `${buildModuleId(params)}-content-${params.contentIndex}`
}

/**
 * Parameters for building a preview content ID (distinct from {@link buildContentId}).
 */
export interface BuildPreviewContentIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The module index.
     */
    moduleIndex: number
    /**
     * The preview content index within the module.
     */
    previewContentIndex: number
}

/**
 * Build a preview content ID (must not collide with main content IDs).
 * @param params - The parameters for building the preview content ID.
 * @returns The preview content ID.
 */
export const buildPreviewContentId = (params: BuildPreviewContentIdParams) => {
    return `${buildModuleId(params)}-preview-content-${params.previewContentIndex}`
}

/**
 * Parameters for building a pricing phase ID.
 */
export interface BuildPricingPhaseIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The pricing phase index.
     */
    phaseIndex: number
}

/**
 * Build a pricing phase ID.
 * @param params - The parameters for building the pricing phase ID.
 * @param params.courseId - The course ID.
 * @param params.phaseIndex - The pricing phase index.
 * @returns The pricing phase ID.
 */
export const buildPricingPhaseId = (params: BuildPricingPhaseIdParams) => {
    return `${params.courseId}-pricing-${params.phaseIndex}`
}

/**
 * Parameters for building a value proposition ID.
 */
export interface BuildValuePropositionIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The value proposition index.
     */
    valuePropositionIndex: number
}

/**
 * Build a value proposition ID.
 * @param params - The parameters for building the value proposition ID.
 * @param params.courseId - The course ID.
 * @param params.valuePropositionIndex - The value proposition index.
 * @returns The value proposition ID.
 */
export const buildValuePropositionId = (params: BuildValuePropositionIdParams) => {
    return `${params.courseId}-value-proposition-${params.valuePropositionIndex}`
}

/**
 * Parameters for building a prerequisite ID.
 */
export interface BuildPrerequisiteIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The prerequisite index.
     */
    prerequisiteIndex: number
}

/**
 * Build a prerequisite ID.
 * @param params - The parameters for building the prerequisite ID.
 * @param params.courseId - The course ID.
 * @param params.prerequisiteIndex - The prerequisite index.
 * @returns The prerequisite ID.
 */
export const buildPrerequisiteId = (params: BuildPrerequisiteIdParams) => {
    return `${params.courseId}-prerequisite-${params.prerequisiteIndex}`
}

/**
 * Parameters for building a QNA ID.
 */
export interface BuildQnaIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The QNA index.
     */
    qnaIndex: number
}

/**
 * Build a QNA ID.
 * @param params - The parameters for building the QNA ID.
 * @param params.courseId - The course ID.
 * @param params.qnaIndex - The QNA index.
 * @returns The QNA ID.
 */
export const buildQnaId = (params: BuildQnaIdParams) => {
    return `${params.courseId}-qna-${params.qnaIndex}`
}

/**
 * Parameters for building a lesson video ID.
 */
export interface BuildLessonVideoIdParams {
    /**
     * The course ID.
     */
    courseId: CourseId
    /**
     * The module index.
     */
    moduleIndex: number
}

/**
 * Build a lesson video ID.
 * @param params - The parameters for building the lesson video ID.
 * @param params.courseId - The course ID.
 * @param params.moduleIndex - The module index.
 * @returns The lesson video ID.
 */
export const buildLessonVideoId = (params: BuildLessonVideoIdParams) => {
    return `${params.courseId}-lesson-video-${params.moduleIndex}`
}