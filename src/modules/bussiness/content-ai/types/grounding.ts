import type {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    ContentAiScope,
} from "./session"

/**
 * Result of a page-scope grounding resolver that ALSO resolves the surface's
 * owning course (content / task / challenge / quiz) -- the course id doubles as
 * the key for the additive BASE (course-wide) grounding, so it is returned
 * alongside the page text instead of being re-resolved a second time.
 */
export interface PageGroundingResult {
    /** The scope's own grounding text ("" when the entitlement gate refused). */
    grounding: string
    /** The surface's owning course, or `null` when it could not be resolved. */
    courseId: string | null
}

/** Params for {@link ContentAiService.resolveLessonGrounding}. */
export interface ResolveLessonGroundingParams {
    /** The asking learner (drives the premium-content entitlement gate). */
    userId: string
    /** Lesson content the question is about. */
    contentId: string
    /** The learner's question about this content. */
    question: string
    /** Active request locale -- which body locale to load. */
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

/**
 * Params for {@link ContentAiService.resolveBaseGrounding}: the ADDITIVE
 * course-wide layer stacked under every scope's own page grounding (and the
 * WHOLE grounding for the `"course"` scope, which has no page of its own).
 */
export interface ResolveBaseGroundingParams {
    /** The asking learner (drives the enrolled / premium-exclusion split). */
    userId: string
    /** The course to ground the BASE layer on. */
    courseId: string
    /** The learner's question. */
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

/** Params for {@link ContentAiService.buildSystemPrompt}. */
export interface BuildSystemPromptParams {
    /**
     * The additive course-wide BASE grounding, rendered under its own
     * `=== COURSE KNOWLEDGE (retrieved) ===` header ahead of the scope
     * section -- empty ("") omits the section entirely. For the `"course"`
     * scope this is always "" (its grounding is carried in `page` instead, so
     * it renders through the existing single `=== COURSE MATERIAL ===`
     * section rather than a duplicate header).
     */
    base: string
    /** The scope's own page grounding (lesson body, task brief, course RAG, ...). */
    page: string
    /** Active request locale -- selects the reply language. */
    locale: Locale
    /** Which surface persona + section header to render. */
    scope: ContentAiScope
}
