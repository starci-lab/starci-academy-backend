import type {
    MockSessionScope,
} from "./session"
import type {
    MockInvoiceItem,
} from "./invoice"

/** Scope + a new user's optional name/email (signup, wizard, or user-create). */
export interface CreateSessionUserParams extends MockSessionScope {
    /** Display name; when omitted it is derived from the email local-part. */
    name?: string
    /** Email for the new user; when omitted it is derived from the name. */
    email?: string
}

/** Scope + the id of the user to remove. */
export interface DeleteSessionUserParams extends MockSessionScope {
    /** Numeric id of the user to remove. */
    userId: number
}

/** Scope + the patch payload for a user's name. */
export interface PatchSessionUserParams extends MockSessionScope {
    /** Numeric id of the user to update. */
    userId: number
    /** New display name. */
    name: string
    /** When true the store throws to simulate a server-500 (rollback demo). */
    fail: boolean
}

/** Scope + cursor pagination params for the infinite-query lesson. */
export interface GetSessionUsersPageParams extends MockSessionScope {
    /** Cursor index (the offset after which to start). */
    cursor: number
    /** Maximum number of users to return. */
    limit: number
}

/** Scope + the username to check for availability. */
export interface CheckUsernameParams extends MockSessionScope {
    /** Candidate username (matched case-insensitively against existing user names). */
    username: string
}

/** Result of a username-availability check. */
export interface CheckUsernameResult {
    /** True when no existing user in the session holds this name. */
    available: boolean
}

/** Scope + the invoice payload to create. */
export interface CreateInvoiceParams extends MockSessionScope {
    /** Customer name the invoice is addressed to. */
    customer: string
    /** Line items used to compute the invoice total. */
    items: Array<MockInvoiceItem>
}

/** Result returned after creating an invoice. */
export interface CreateInvoiceResult {
    /** Numeric id assigned to the new invoice. */
    id: number
    /** Computed total = sum of quantity * unitPrice. */
    total: number
}
