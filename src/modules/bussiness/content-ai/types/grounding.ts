import type {
    ContentEntity,
    Locale,
} from "@modules/databases"

/** Params for {@link ContentAiService.resolveLessonGrounding}. */
export interface ResolveLessonGroundingParams {
    /** The asking learner (drives the premium-content entitlement gate). */
    userId: string
    /** Lesson content the question is about. */
    contentId: string
    /** The learner's question about this content. */
    question: string
    /** Active request locale — which body locale to load. */
    locale: Locale
}

/** Params for {@link ContentAiService.resolveTaskGrounding}. */
export interface ResolveTaskGroundingParams {
    /** The asking learner (drives the enrolled-only gate). */
    userId: string
    /** Capstone / personal-project task the question is about. */
    taskId: string
    /** The learner's question about this task. */
    question: string
}

/** Params for {@link ContentAiService.resolveChallengeGrounding}. */
export interface ResolveChallengeGroundingParams {
    /** The asking learner (drives the enrolled-only gate). */
    userId: string
    /** Hands-on challenge the question is about. */
    challengeId: string
    /** The learner's question about this challenge. */
    question: string
}

/** Params for {@link ContentAiService.resolveQuizGrounding}. */
export interface ResolveQuizGroundingParams {
    /** The asking learner (drives the enrolled-only gate). */
    userId: string
    /** Flashcard-quiz deck the question is drawn from. */
    quizId: string
    /** The learner's question about this quiz. */
    question: string
}

/** Params for {@link ContentAiService.resolveFoundationGrounding}. */
export interface ResolveFoundationGroundingParams {
    /** Accepted for signature symmetry with the other scopes; unused (global doc, no per-user gate). */
    userId: string
    /** Global foundation-library doc the question is about. */
    foundationId: string
    /** The learner's question about this document. */
    question: string
}

/** Params for {@link ContentAiService.resolveCourseGrounding}. */
export interface ResolveCourseGroundingParams {
    /** The asking learner (drives the enrolled-only gate). */
    userId: string
    /** Course the question is about. */
    courseId: string
    /** The learner's question about the course. */
    question: string
}

/** Params for {@link ContentAiService.resolveGrounding}. */
export interface ResolveGroundingParams {
    /** The content snapshot loaded from MinIO. */
    content: ContentEntity
    /** Lesson content id, used to key the RAG retrieval fallback. */
    contentId: string
    /** The learner's question about this content. */
    question: string
    /** The whole lesson body (used when the content fits without retrieval). */
    body: string
}
