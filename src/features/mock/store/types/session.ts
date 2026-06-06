import type {
    MockUser,
} from "./user"
import type {
    MockInvoice,
} from "./invoice"

/** In-memory data stored per (module, lesson, session) tuple. */
export interface MockSession {
    /** Ordered list of users for this session. */
    users: Array<MockUser>
    /** Invoices created in this session (dynamic-fields lesson; empty otherwise). */
    invoices: Array<MockInvoice>
    /** Wall-clock timestamp when this session was last accessed (drives TTL eviction). */
    lastAccessedAt: number
}

/** Identifies one isolated sandbox session for a specific lesson. */
export interface MockSessionScope {
    /** Module display id (e.g. `5-form-mastery-rhf-zod`). */
    moduleId: string
    /** Lesson display id (e.g. `1-async-validation-with-debounce`). */
    lessonId: string
    /** Session identifier the client generates and embeds in the mock URL. */
    sessionId: string
}
