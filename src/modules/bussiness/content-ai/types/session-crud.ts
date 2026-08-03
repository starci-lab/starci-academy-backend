import type {
    ContentAiScope,
} from "./session"

/** Params for {@link ContentAiService.createSession}. */
export interface CreateContentAiSessionParams {
    /** The learner the session is created for. */
    userId: string
    /** Explicit scope; when omitted, derived by anchor priority (content > task > challenge > quiz > foundation > course). */
    scope?: ContentAiScope | null
    /** Lesson content the session is anchored to (content scope). */
    contentId?: string | null
    /** Capstone / personal-project task the session is anchored to (task scope). */
    taskId?: string | null
    /** Hands-on challenge the session is anchored to (challenge scope). */
    challengeId?: string | null
    /** Flashcard-quiz deck the session is anchored to (quiz scope). */
    quizId?: string | null
    /** Global foundation-library doc the session is anchored to (foundation scope). */
    foundationId?: string | null
    /** Course the session is anchored to when no lesson/task/foundation is open (course scope). */
    courseId?: string | null
    /**
     * Born-archived: stamp `archived_at = now()` at creation so the
     * conversation never clutters the default history list yet stays
     * searchable. Used for selection-passage ("explain this") chats — a
     * one-off side-thread that inherits the surface grounding + the passage.
     */
    archived?: boolean | null
}

/** Params for {@link ContentAiService.sessions}. */
export interface ContentAiSessionsParams {
    /** The learner whose conversations are listed. */
    userId: string
    /** Explicit scope; when omitted, derived by anchor priority, mirroring {@link CreateContentAiSessionParams}. */
    scope?: ContentAiScope | null
    /** Lesson content to scope the list to (content scope). */
    contentId?: string | null
    /** Capstone / personal-project task to scope the list to (task scope). */
    taskId?: string | null
    /** Hands-on challenge to scope the list to (challenge scope). */
    challengeId?: string | null
    /** Flashcard-quiz deck to scope the list to (quiz scope). */
    quizId?: string | null
    /** Global foundation-library doc to scope the list to (foundation scope). */
    foundationId?: string | null
    /** Course to scope the list to (course scope). */
    courseId?: string | null
    /** Free-text search over title / message text; content-scope search spans the whole course. */
    search?: string
    /** Page size (clamped 1-50). */
    limit?: number
    /** Page offset. */
    offset?: number
    /** Include archived conversations in a plain (non-search) list. */
    includeArchived?: boolean
}

/** Params for {@link ContentAiService.listScopedSessions}. */
export interface ListScopedContentAiSessionsParams {
    /** The learner whose conversations are listed. */
    userId: string
    /** The non-content scope being listed: task, challenge, quiz, foundation, or course. */
    scope: ContentAiScope
    /** Capstone / personal-project task to scope the list to (task scope). */
    taskId?: string | null
    /** Hands-on challenge to scope the list to (challenge scope). */
    challengeId?: string | null
    /** Flashcard-quiz deck to scope the list to (quiz scope). */
    quizId?: string | null
    /** Global foundation-library doc to scope the list to (foundation scope). */
    foundationId?: string | null
    /** Course to scope the list to (course scope). */
    courseId?: string | null
    /** Free-text search over title / message text (trimmed; empty = no search). */
    search: string
    /** Page size. */
    limit: number
    /** Page offset. */
    offset: number
    /** Include archived conversations in a plain (non-search) list. */
    includeArchived: boolean
}

/** Params for {@link ContentAiService.loadSessionMessages}. */
export interface LoadContentAiSessionMessagesParams {
    /** The asking learner (must own the session). */
    userId: string
    /** The session whose turns are loaded. */
    sessionId: string
}

/** Params for {@link ContentAiService.saveTurn}. */
export interface SaveContentAiTurnParams {
    /** The learner the turn is saved under. */
    userId: string
    /** The conversation the turn is appended to. */
    sessionId: string
    /** Lesson content the turn was grounded on (content scope only). */
    contentId?: string | null
    /** The learner's question. */
    question: string
    /** The model's answer. */
    answer: string
}

/** Params for {@link ContentAiService.deleteSession}. */
export interface DeleteContentAiSessionParams {
    /** The learner (must own the session). */
    userId: string
    /** The session to delete. */
    sessionId: string
}

/** Params for {@link ContentAiService.renameContentAiSession}. */
export interface RenameContentAiSessionParams {
    /** The learner (must own the session). */
    userId: string
    /** The session to rename. */
    sessionId: string
    /** The new title (blank/empty resets to auto-titling). */
    title: string
}

/** Params for {@link ContentAiService.setContentAiSessionArchived}. */
export interface SetContentAiSessionArchivedParams {
    /** The learner (must own the session). */
    userId: string
    /** The session to archive / unarchive. */
    sessionId: string
    /** The target archived state. */
    archived: boolean
}

/** Params for {@link ContentAiService.touchSession}. */
export interface TouchContentAiSessionParams {
    /** The learner (must own the session). */
    userId: string
    /** The session being opened. */
    sessionId: string
}

/** Result of {@link ContentAiService.resolveOwnedSession}: the session's owner anchors, when owned. */
export interface ResolvedContentAiSessionOwner {
    /** The session's enrollment owner (course-scoped sessions); null for a foundation session. */
    enrollmentId: string | null
    /** The session's raw-user owner (foundation sessions); null for a course-scoped session. */
    userId: string | null
}
