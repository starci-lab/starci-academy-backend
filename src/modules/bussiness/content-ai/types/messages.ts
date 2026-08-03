import type {
    Locale,
} from "@modules/databases"
import type {
    BaseMessage,
} from "@langchain/core/messages"
import type {
    ContentAiHistoryMessage,
} from "./session"

/** Params for {@link ContentAiService.prepareMessages}. */
export interface PrepareContentAiMessagesParams {
    /** The asking learner (drives the premium-content entitlement gate). */
    userId: string
    /** Lesson content the question is about (lesson scope). */
    contentId?: string | null
    /** Capstone / personal-project task the question is about (task scope). */
    taskId?: string | null
    /** Hands-on challenge the question is about (challenge scope, enrolled-only). */
    challengeId?: string | null
    /** Flashcard-quiz deck the question is about (quiz scope, enrolled-only; FE hides chat during a live attempt). */
    quizId?: string | null
    /** Global foundation-library doc the question is about (foundation scope). */
    foundationId?: string | null
    /** Course the question is about when no lesson/task/foundation is open (course scope, enrolled-only). */
    courseId?: string | null
    /** The learner's question about this content. */
    question: string
    /** Recent prior turns (oldest first) for short-term memory; capped here. */
    history?: Array<ContentAiHistoryMessage>
    /** Active request locale — reply language + which body locale to load. */
    locale: Locale
}

/** Result of {@link ContentAiService.prepareMessages}. */
export interface PrepareContentAiMessagesResult {
    /** The ordered messages to invoke/stream against the model. */
    messages: Array<BaseMessage>
}
