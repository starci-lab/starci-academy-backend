import type {
    ContentCommentEntity,
    UserEntity,
} from "@modules/databases"

/**
 * Params to create a comment (top-level or reply). A top-level comment is scoped to
 * EITHER a lesson content ({@link contentId}) or a whole course ({@link courseId}, a
 * course-general question) -- exactly one must be set. A reply
 * (`parentCommentId` set) inherits its scope from the parent instead; both scope
 * fields are ignored for replies.
 */
export interface CreateCommentParams {
    /** Content the comment is attached to; omit for a course-general question. */
    contentId?: string | null
    /** Course the comment is attached to (course-general question); omit for a lesson question. */
    courseId?: string | null
    /** Parent comment id when replying; null/omitted for a top-level comment. */
    parentCommentId?: string | null
    /** Raw comment body authored by the user. */
    body: string
    /** Authenticated author. */
    user: UserEntity
}

/** Params to edit an existing comment (author only). */
export interface UpdateCommentParams {
    /** Comment being edited. */
    commentId: string
    /** New body to persist. */
    body: string
    /** Authenticated user performing the edit (must be the author). */
    user: UserEntity
}

/** Params to soft-delete a comment (author only). */
export interface DeleteCommentParams {
    /** Comment being deleted. */
    commentId: string
    /** Authenticated user performing the delete (must be the author). */
    user: UserEntity
}

/** Result of a soft-delete. */
export interface DeleteCommentResult {
    /** Id of the deleted comment. */
    id: string
}

/**
 * Params to list comments, optionally scoped to one parent (replies). A top-level
 * listing (`parentCommentId` omitted) requires exactly one of `contentId`/`courseId`;
 * a reply listing only needs `parentCommentId` -- it ignores both scope fields (the
 * parent already pins the exact thread, and a course-general question's replies have
 * no `contentId` to scope by anyway).
 */
export interface ListCommentsParams {
    /** Content whose top-level comments are listed; omit for a course-general scope or a reply listing. */
    contentId?: string | null
    /** Course whose top-level (course-general) comments are listed; omit for a lesson scope or a reply listing. */
    courseId?: string | null
    /** When set, list replies of this comment; when null/omitted, list top-level comments. */
    parentCommentId?: string | null
    /** 1-based page number (default 1). */
    page?: number
    /** Page size (default 20). */
    limit?: number
}

/**
 * One raw grouped-count row from the reply-count query
 * (`SELECT parent_comment_id AS parentId, COUNT(*) AS count`). `count` is a
 * string because Postgres returns `COUNT(*)` as `bigint` text over the wire.
 */
export interface ReplyCountRow {
    /** The parent comment whose replies were counted. */
    parentId: string
    /** Number of direct replies, as a numeric string. */
    count: string
}

/** Result of a comment list query. */
export interface ListCommentsResult {
    /** The page of comment rows (author relation loaded). */
    comments: Array<ContentCommentEntity>
    /** Total comments matching the scope (for pagination). */
    total: number
}

/**
 * Answer-status filter for the course Q&A roll-up. A "question" is a top-level
 * content comment; its "answers" are its replies. This drives the WHERE/order of
 * {@link ListCourseQuestionsParams}.
 */
export enum CourseQuestionFilter {
    /** Questions with zero replies yet (the answering queue). */
    Unanswered = "unanswered",
    /** Questions that already have at least one reply. */
    Answered = "answered",
    /** Questions authored by the calling user. */
    Mine = "mine",
    /** No answer-status filter -- every question in the course. */
    All = "all",
}

/**
 * Params to list a course's questions (top-level comments across all its lessons).
 */
export interface ListCourseQuestionsParams {
    /** Course whose lessons' top-level comments are aggregated. */
    courseId: string
    /** Answer-status filter applied to the roll-up. */
    filter: CourseQuestionFilter
    /** Optional case-insensitive body substring to match (ILIKE). */
    search?: string | null
    /** 1-based page number (default 1). */
    page?: number
    /** Page size (default 20). */
    limit?: number
    /** Calling user id -- required to resolve the `mine` filter. */
    userId: string
}

/**
 * One question row: the top-level comment entity plus the computed answer
 * aggregates the resolver needs to build a client node. The comment carries its
 * `content` (-> `module`) and `user` relations loaded.
 */
export interface CourseQuestionRow {
    /** The top-level comment entity (with `content.module` + `user` loaded). */
    comment: ContentCommentEntity
    /** Number of direct replies (answers) to this question. */
    replyCount: number
    /** Whether any reply's author is the founder (an official answer). */
    answeredByFounder: boolean
}

/** Result of the course questions roll-up query. */
export interface ListCourseQuestionsResult {
    /** The page of question rows with their computed answer aggregates. */
    questions: Array<CourseQuestionRow>
    /** Total questions matching the filter (for pagination). */
    total: number
}

/**
 * One raw grouped-count row from the founder-answered lookup
 * (`SELECT parent_comment_id AS parentId`). Only the parent id is selected --
 * presence in the set means "answered by founder".
 */
export interface FounderAnsweredRow {
    /** The parent (question) comment id that has a founder reply. */
    parentId: string
}
