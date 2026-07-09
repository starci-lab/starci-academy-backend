import type {
    MockInterviewAttemptSummary,
} from "../../my-mock-interview-attempts/types"

/** Params for {@link import("../my-mock-interview-attempt-by-session.service").MyMockInterviewAttemptBySessionService.find}. */
export interface FindMyMockInterviewAttemptBySessionParams {
    /** Viewer the attempt must belong to. */
    userId: string
    /** Course the attempt must belong to (mirrors the enrollment it's keyed by). */
    courseId: string
    /** The session id to look up — a client-generated id grouping the draw/turns/grade of one interview run. */
    sessionId: string
}

/** Re-exported for callers that only need the result shape. */
export type MyMockInterviewAttemptBySessionResult = MockInterviewAttemptSummary
