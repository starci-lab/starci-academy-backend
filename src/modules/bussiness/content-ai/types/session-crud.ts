import type {
    ContentAiScope 
} from "./session"

/** Params for {@link ContentAiService.createSession}. */
export interface CreateContentAiSessionParams {
  /** The learner the session is created for. */
  userId: string;
  /** Explicit scope; when omitted, derived by anchor priority (content > task > challenge > quiz > foundation > course > global). */
  scope?: ContentAiScope | null;
  /** Lesson content the session is anchored to (content scope). */
  contentId?: string | null;
  /** Capstone / personal-project task the session is anchored to (task scope). */
  taskId?: string | null;
  /** Hands-on challenge the session is anchored to (challenge scope). */
  challengeId?: string | null;
  /** Flashcard-quiz deck the session is anchored to (quiz scope). */
  quizId?: string | null;
  /** Global foundation-library doc the session is anchored to (foundation scope). */
  foundationId?: string | null;
  /** Course the session is anchored to when no lesson/task/foundation is open (course scope). */
  courseId?: string | null;
  /**
   * Born-archived: stamp `archived_at = now()` at creation so the
   * conversation never clutters the default history list yet stays
   * searchable. Used for selection-passage ("explain this") chats -- a
   * one-off side-thread that inherits the surface grounding + the passage.
   */
  archived?: boolean | null;
}

/** Params for {@link ContentAiService.sessions}. */
export interface ContentAiSessionsParams {
  /** The learner whose conversations are listed. */
  userId: string;
  /** Explicit scope; when omitted, derived by anchor priority, mirroring {@link CreateContentAiSessionParams}. */
  scope?: ContentAiScope | null;
  /** Lesson content to scope the list to (content scope). */
  contentId?: string | null;
  /** Capstone / personal-project task to scope the list to (task scope). */
  taskId?: string | null;
  /** Hands-on challenge to scope the list to (challenge scope). */
  challengeId?: string | null;
  /** Flashcard-quiz deck to scope the list to (quiz scope). */
  quizId?: string | null;
  /** Global foundation-library doc to scope the list to (foundation scope). */
  foundationId?: string | null;
  /** Course to scope the list to (course scope). */
  courseId?: string | null;
  /** Free-text search over title / message text; content-scope search spans the whole course. */
  search?: string;
  /** Page size (clamped 1-50). */
  limit?: number;
  /** Page offset. */
  offset?: number;
  /** Include archived conversations in a plain (non-search) list. */
  includeArchived?: boolean;
}

/** Params for {@link ContentAiService.listScopedSessions}. */
export interface ListScopedContentAiSessionsParams {
  /** The learner whose conversations are listed. */
  userId: string;
  /** The non-content scope being listed: task, challenge, quiz, foundation, or course. */
  scope: ContentAiScope;
  /** Capstone / personal-project task to scope the list to (task scope). */
  taskId?: string | null;
  /** Hands-on challenge to scope the list to (challenge scope). */
  challengeId?: string | null;
  /** Flashcard-quiz deck to scope the list to (quiz scope). */
  quizId?: string | null;
  /** Global foundation-library doc to scope the list to (foundation scope). */
  foundationId?: string | null;
  /** Course to scope the list to (course scope). */
  courseId?: string | null;
  /** Free-text search over title / message text (trimmed; empty = no search). */
  search: string;
  /** Page size. */
  limit: number;
  /** Page offset. */
  offset: number;
  /** Include archived conversations in a plain (non-search) list. */
  includeArchived: boolean;
}

/** Params for {@link ContentAiService.loadSessionMessages}. */
export interface LoadContentAiSessionMessagesParams {
  /** The asking learner (must own the session). */
  userId: string;
  /** The session whose turns are loaded. */
  sessionId: string;
}

/** Params for {@link ContentAiService.saveTurn}. */
export interface SaveContentAiTurnParams {
  /** The learner the turn is saved under. */
  userId: string;
  /** The conversation the turn is appended to. */
  sessionId: string;
  /** Lesson content the turn was grounded on (content scope only). */
  contentId?: string | null;
  /** The learner's question. */
  question: string;
  /** The model's answer. */
  answer: string;
}

/** Durable execution state for one idempotent content-AI request. */
export type ContentAiTurnState =
  | "processing"
  | "charging"
  | "completed"
  | "failed"
  | "cancelled";

/** Result returned when the gateway claims or resumes one durable turn. */
export type AcquireContentAiTurnOutcome =
  | "acquired"
  | "replay"
  | "in-progress"
  | "recovery-required"
  | "conflict"
  | "not-owned";

/** Params for {@link ContentAiService.acquireTurn}. */
export interface AcquireContentAiTurnParams {
  /** The learner that must own the conversation. */
  userId: string;
  /** The course-scoped conversation receiving the turn. */
  sessionId: string;
  /** Client-generated request identity (the existing socket stream id). */
  streamId: string;
  /** SHA-256 of every input that can affect the generated answer. */
  requestHash: string;
  /** Optional lesson context whose course must match the session. */
  contentId?: string | null;
  /** Optional task context whose course must match the session. */
  taskId?: string | null;
  /** Optional challenge context whose course must match the session. */
  challengeId?: string | null;
  /** Optional quiz context whose course must match the session. */
  quizId?: string | null;
  /** Explicit active course, when the request has no narrower course item. */
  courseId?: string | null;
  /** Require the owned session to belong to the Learn companion experience. */
  experience?: "learn_companion" | null;
}

/** Durable claim/replay decision for one request identity. */
export interface AcquireContentAiTurnResult {
  /** Whether the caller may execute, replay, wait, recover, or reject. */
  outcome: AcquireContentAiTurnOutcome;
  /** Stored completed response, present only for replay. */
  answer?: string;
  /** Course resolved from the owned session, used for course-level grounding. */
  courseId?: string | null;
}

/** Params for the pre-charge durability barrier. */
export interface MarkContentAiTurnChargingParams extends AcquireContentAiTurnParams {
  /** Fully buffered provider response held before entitlement consumption. */
  answer: string;
}

/** Params for atomically appending the transcript and completing a charged turn. */
export interface CompleteContentAiTurnParams extends MarkContentAiTurnChargingParams {
  /** Lesson content the completed turn was grounded on, when applicable. */
  contentId?: string | null;
  /** The learner's original question. */
  question: string;
}

/** Retryable terminal states written only before the charging barrier. */
export type ContentAiTurnTerminalState = Extract<
  ContentAiTurnState,
  "failed" | "cancelled"
>;

/** Params for recording a provider failure or learner cancellation. */
export interface MarkContentAiTurnTerminalParams extends AcquireContentAiTurnParams {
  /** Terminal state; charging is intentionally not recoverable automatically. */
  state: ContentAiTurnTerminalState;
  /** Bounded operational failure summary, never a provider transcript. */
  errorCode: string;
}

/** Course-level Learn companion returned to the Learn shell. */
export interface LearnAiCompanionSession {
  id: string;
  courseId: string;
  enrollmentId: string;
  title: string | null;
  archivedAt: Date | null;
  updatedAt: Date;
}

/** One durable request state exposed beside the visible transcript. */
export interface LearnAiCompanionTurn {
  streamId: string;
  state: ContentAiTurnState;
  response: string | null;
  errorCode: string | null;
  attemptCount: number;
  updatedAt: Date;
}

/** Params for resolving the one active companion of an enrollment/course. */
export interface ResolveLearnAiCompanionParams {
  userId: string;
  courseId: string;
}

/** Params for reading the active course companion without creating it. */
export interface LoadLearnAiCompanionParams extends ResolveLearnAiCompanionParams {
  limit?: number;
  offset?: number;
}

/** Course companion read model used by the dedicated Learn query. */
export interface LearnAiCompanionSnapshot {
  session: LearnAiCompanionSession | null;
  messages: Array<{
    role: string;
    content: string;
  }>;
  turns: Array<LearnAiCompanionTurn>;
}

/** Result of archiving the current course companion. */
export interface ResetLearnAiCompanionResult {
  archivedSessionId: string | null;
}

/** Params for {@link ContentAiService.deleteSession}. */
export interface DeleteContentAiSessionParams {
  /** The learner (must own the session). */
  userId: string;
  /** The session to delete. */
  sessionId: string;
}

/** Params for {@link ContentAiService.renameContentAiSession}. */
export interface RenameContentAiSessionParams {
  /** The learner (must own the session). */
  userId: string;
  /** The session to rename. */
  sessionId: string;
  /** The new title (blank/empty resets to auto-titling). */
  title: string;
}

/** Params for {@link ContentAiService.setContentAiSessionArchived}. */
export interface SetContentAiSessionArchivedParams {
  /** The learner (must own the session). */
  userId: string;
  /** The session to archive / unarchive. */
  sessionId: string;
  /** The target archived state. */
  archived: boolean;
}

/** Params for {@link ContentAiService.touchSession}. */
export interface TouchContentAiSessionParams {
  /** The learner (must own the session). */
  userId: string;
  /** The session being opened. */
  sessionId: string;
}

/** Params for {@link ContentAiService.deriveScopeByAnchorPriority}: the anchor ids to prioritize between. */
export interface DeriveContentAiScopeByAnchorPriorityParams {
  /** Lesson content anchor (content scope). */
  contentId?: string | null;
  /** Capstone / personal-project task anchor (task scope). */
  taskId?: string | null;
  /** Hands-on challenge anchor (challenge scope). */
  challengeId?: string | null;
  /** Flashcard-quiz deck anchor (quiz scope). */
  quizId?: string | null;
  /** Global foundation-library doc anchor (foundation scope). */
  foundationId?: string | null;
  /** Course anchor (course scope). */
  courseId?: string | null;
}

/** Params for {@link ContentAiService.resolveSessionRowToCreate}: the learner plus every anchor id. */
export interface ResolveSessionRowToCreateAnchors {
  /** The learner the session is created for. */
  userId: string;
  /** Lesson content anchor (content scope). */
  contentId?: string | null;
  /** Capstone / personal-project task anchor (task scope). */
  taskId?: string | null;
  /** Hands-on challenge anchor (challenge scope). */
  challengeId?: string | null;
  /** Flashcard-quiz deck anchor (quiz scope). */
  quizId?: string | null;
  /** Global foundation-library doc anchor (foundation scope). */
  foundationId?: string | null;
  /** Course anchor (course scope). */
  courseId?: string | null;
}

/** Anchor ids {@link ContentAiService.resolveScopedSessionOwner} picks between, by scope. */
export interface ResolveScopedSessionOwnerAnchors {
  /** The learner whose ownership is being resolved. */
  userId: string;
  /** Capstone / personal-project task anchor (task scope). */
  taskId?: string | null;
  /** Hands-on challenge anchor (challenge scope). */
  challengeId?: string | null;
  /** Flashcard-quiz deck anchor (quiz scope). */
  quizId?: string | null;
  /** Global foundation-library doc anchor (foundation scope). */
  foundationId?: string | null;
  /** Course anchor (course scope). */
  courseId?: string | null;
}

/**
 * Resolved owner + anchor predicate for one non-content scope's session query.
 * Column names are whitelisted (never client input) so they interpolate safely.
 */
export interface ScopedSessionOwner {
  /** Which column identifies the owning row: enrollment (course-scoped) or raw user (global-scoped). */
  ownerColumn: "enrollment_id" | "user_id";
  /** The resolved owner id, or `null` when unentitled (no matching enrollment). */
  ownerId: string | null;
  /** Which column narrows to the specific anchor, or `null` for course/global (scope alone narrows). */
  anchorColumn:
    | "origin_task_id"
    | "origin_challenge_id"
    | "origin_quiz_id"
    | "origin_foundation_id"
    | null;
  /** The anchor id to filter by, paired with `anchorColumn`. */
  anchorId: string | null;
}

/** Params to build the parametrized SQL for {@link ContentAiService.listScopedSessions}. */
export interface BuildScopedSessionsQueryParams {
  /** The resolved owner id (non-null; caller already returned early otherwise). */
  ownerId: string;
  /** The scope being listed. */
  scope: ContentAiScope;
  /** The anchor column to filter by, or `null` for course/global. */
  anchorColumn: ScopedSessionOwner["anchorColumn"];
  /** The anchor id to filter by, paired with `anchorColumn`. */
  anchorId: string | null;
  /** Free-text search (trimmed; empty = no search). */
  search: string;
  /** Include archived conversations in a plain (non-search) list. */
  includeArchived: boolean;
  /** Page size. */
  limit: number;
  /** Page offset. */
  offset: number;
}

/** The parametrized SQL fragments + bound params built by {@link ContentAiService.buildScopedSessionsQuery}. */
export interface BuildScopedSessionsQueryResult {
  /** The bound query params, in `$N` order. */
  params: Array<unknown>;
  /** The `AND s.<anchorColumn> = $N` fragment, or `""` when the scope has no anchor. */
  anchorClause: string;
  /** The search-or-archived `AND (...)` fragment. */
  searchClause: string;
  /** The snippet subquery expression (a search match's message, else `NULL`). */
  snippetExpr: string;
  /** The `$N` position of the `LIMIT` param. */
  limitParam: number;
  /** The `$N` position of the `OFFSET` param. */
  offsetParam: number;
}

/** Result of {@link ContentAiService.resolveOwnedSession}: the session's owner anchors, when owned. */
export interface ResolvedContentAiSessionOwner {
  /** The session's enrollment owner (course-scoped sessions); null for a foundation session. */
  enrollmentId: string | null;
  /** The session's raw-user owner (foundation sessions); null for a course-scoped session. */
  userId: string | null;
}
