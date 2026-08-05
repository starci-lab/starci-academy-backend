import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
} from "@nestjs/common"
import {
    MockSessionUserNotFoundException,
    MockSimulatedFailureException,
} from "@modules/platform/exceptions/errors/mock/session-store"
import {
    resolveMockDefinition,
} from "./registry"
import type {
    CreateSessionUserParams,
    DeleteSessionUserParams,
    PatchSessionUserParams,
    GetSessionUsersPageParams,
    CheckUsernameParams,
    CheckUsernameResult,
    CreateInvoiceParams,
    CreateInvoiceResult,
} from "./types/params"
import type {
    MockSession,
    MockSessionScope,
} from "./types/session"
import type {
    MockUser,
    MockUsersPage,
} from "./types/user"

/** Sessions idle longer than this are evicted by the background cleaner. */
const SESSION_TTL_MS = 30 * 60 * 1000

/** How often the cleanup interval runs (every 5 minutes). */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

@Injectable()
/**
 * Shared in-memory store for sandbox mock sessions.
 *
 * Data is isolated per (moduleId, lessonId, sessionId) tuple: each Sandpack
 * instance owns its own copy, seeded from the per-lesson registry definition,
 * so different lessons get different demo data and students never see each
 * other's mutations. Sessions are evicted after 30 minutes idle. Every lesson
 * controller injects this one service for its data operations.
 */
export class SessionStoreService implements OnModuleInit, OnModuleDestroy {
    /** Map from composite key to session data. */
    private readonly sessions = new Map<string, MockSession>()

    /** Handle for the periodic eviction timer. */
    private cleanupHandle: NodeJS.Timeout | null = null

    onModuleInit(): void {
        // start background cleanup loop to evict stale sessions
        this.cleanupHandle = setInterval(
            () => {
                this.evictStaleSessions()
            },
            CLEANUP_INTERVAL_MS,
        )
    }

    onModuleDestroy(): void {
        // stop the cleanup loop on shutdown to avoid leaks / a hung process
        if (this.cleanupHandle) {
            clearInterval(this.cleanupHandle)
            this.cleanupHandle = null
        }
    }

    /**
     * Returns all users for the session, lazily seeding on first access.
     */
    getUsers(scope: MockSessionScope): Array<MockUser> {
        // touch or seed the session, then return its users
        return this.touchOrCreate(scope).users
    }

    /**
     * Returns a cursor-based page of users for the infinite-query lesson.
     */
    getUsersPage(
        {
            cursor, limit, ...scope
        }: GetSessionUsersPageParams,
    ): MockUsersPage {
        const session = this.touchOrCreate(scope)

        // slice the user list starting at the cursor offset
        const page = session.users.slice(cursor,
            cursor + limit)

        // nextCursor is null once we have passed the end of the list
        const nextCursor = cursor + limit < session.users.length ? cursor + limit : null

        return {
            data: page, nextCursor,
        }
    }

    /**
     * Adds a user and returns it. Accepts any signup/wizard/user payload:
     * the name is derived from the email local-part when omitted, and vice versa.
     */
    createUser(
        {
            name, email, ...scope
        }: CreateSessionUserParams,
    ): MockUser {
        const session = this.touchOrCreate(scope)

        // derive a new id from max existing id + 1 (never reuses deleted ids)
        const nextId = session.users.reduce(
            (maxId, user) => Math.max(maxId,
                user.id),
            0,
        ) + 1

        // resolve a display name: explicit name -> email local-part -> generic label
        const resolvedName = name ?? email?.split("@")[0] ?? `User ${nextId}`

        // resolve an email: explicit email -> slug derived from the name
        const resolvedEmail = email ?? `${resolvedName.toLowerCase().replace(/\s+/g,
            ".")}@starci.dev`

        const user: MockUser = {
            id: nextId, name: resolvedName, email: resolvedEmail,
        }

        session.users.push(user)
        return user
    }

    /**
     * Removes a user from the session by id.
     */
    deleteUser(
        {
            userId, ...scope
        }: DeleteSessionUserParams,
    ): void {
        const session = this.touchOrCreate(scope)

        // remember the count so we can detect a no-op delete
        const before = session.users.length
        session.users = session.users.filter((user) => user.id !== userId)

        // surface a clear error if the id did not exist
        if (session.users.length === before) {
            throw new MockSessionUserNotFoundException({
                userId,
            })
        }
    }

    /**
     * Updates a user's name. When `fail` is true, throws to simulate a server
     * error for the optimistic-update rollback lesson.
     */
    patchUser(
        {
            userId, name, fail, ...scope
        }: PatchSessionUserParams,
    ): MockUser {
        // intentional server-side failure to demonstrate onError rollback
        if (fail) {
            throw new MockSimulatedFailureException({
            })
        }

        const session = this.touchOrCreate(scope)

        // find the target user and update in place
        const user = session.users.find((candidate) => candidate.id === userId)
        if (!user) {
            throw new MockSessionUserNotFoundException({
                userId,
            })
        }

        user.name = name
        return user
    }

    /**
     * Checks whether a username is available (no existing user holds that name).
     */
    checkUsername(
        {
            username, ...scope
        }: CheckUsernameParams,
    ): CheckUsernameResult {
        const session = this.touchOrCreate(scope)

        // case-insensitive compare against existing names; available = no collision
        const target = username.trim().toLowerCase()
        const taken = session.users.some((user) => user.name.toLowerCase() === target)

        return {
            available: !taken,
        }
    }

    /**
     * Creates an invoice from line items, computes the total, persists it, and
     * returns the new id + total (dynamic-fields lesson).
     */
    createInvoice(
        {
            customer, items, ...scope
        }: CreateInvoiceParams,
    ): CreateInvoiceResult {
        const session = this.touchOrCreate(scope)

        // total = sum of quantity * unitPrice across all line items
        const total = items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0,
        )

        // derive a new invoice id from max existing id + 1
        const nextId = session.invoices.reduce(
            (maxId, invoice) => Math.max(maxId,
                invoice.id),
            0,
        ) + 1

        session.invoices.push({
            id: nextId, customer, total,
        })

        return {
            id: nextId, total,
        }
    }

    /**
     * Resets a session's data back to the lesson's seed.
     */
    resetSession(scope: MockSessionScope): void {
        // overwrite with a fresh clone of the lesson's seed
        this.sessions.set(this.key(scope),
            this.freshSession(scope))
    }

    /** Builds the composite store key for a session scope. */
    private key(
        {
            moduleId, lessonId, sessionId,
        }: MockSessionScope,
    ): string {
        return `${moduleId}/${lessonId}/${sessionId}`
    }

    /** Creates a fresh session seeded from the lesson's registry definition. */
    private freshSession(
        {
            moduleId, lessonId,
        }: MockSessionScope,
    ): MockSession {
        // resolve the per-lesson seed (falls back to a generic list if unregistered)
        const {
            seedUsers,
        } = resolveMockDefinition(moduleId,
            lessonId)
        return {
            // deep-clone each user so mutations never touch the shared seed
            users: seedUsers.map((user) => ({
                ...user,
            })),
            // invoices always start empty (only the dynamic-fields lesson writes them)
            invoices: [],
            lastAccessedAt: Date.now(),
        }
    }

    /** Retrieves an existing session (bumping its TTL) or lazily seeds a new one. */
    private touchOrCreate(scope: MockSessionScope): MockSession {
        const key = this.key(scope)
        const existing = this.sessions.get(key)
        if (existing) {
            // bump last-accessed so the TTL countdown resets
            existing.lastAccessedAt = Date.now()
            return existing
        }

        // first access for this tuple -> seed from the lesson definition
        const fresh = this.freshSession(scope)
        this.sessions.set(key,
            fresh)
        return fresh
    }

    /** Removes sessions that have not been accessed within the TTL window. */
    private evictStaleSessions(): void {
        const cutoff = Date.now() - SESSION_TTL_MS

        for (const [key,
            session] of this.sessions.entries()) {
            // drop any session whose last access is older than the TTL cutoff
            if (session.lastAccessedAt < cutoff) {
                this.sessions.delete(key)
            }
        }
    }
}
