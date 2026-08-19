import {
    SessionStoreService
} from "./session-store.service"

const scope = {
    moduleId: "unknown-module",
    lessonId: "unknown-lesson",
    sessionId: "session-a",
}

describe("SessionStoreService",
    () => {
        let store: SessionStoreService

        beforeEach(() => {
            jest.useFakeTimers()
            store = new SessionStoreService()
        })

        afterEach(() => {
            store.onModuleDestroy()
            jest.useRealTimers()
        })

        it("seeds fallback users and isolates sessions",
            () => {
                const users = store.getUsers(scope)
                expect(users.map((user) => user.name)).toEqual(["Alice",
                    "Bob",
                    "Carol"])

                users[0].name = "Changed"
                expect(store.getUsers({
                    ...scope, sessionId: "session-b"
                })[0].name).toBe("Alice")
            })

        it("paginates users and reports the next cursor",
            () => {
                expect(store.getUsersPage({
                    ...scope, cursor: 0, limit: 2
                })).toMatchObject({
                    data: [{
                        id: 1
                    },
                    {
                        id: 2
                    }],
                    nextCursor: 2,
                })
                expect(store.getUsersPage({
                    ...scope, cursor: 2, limit: 2
                })).toMatchObject({
                    data: [{
                        id: 3
                    }],
                    nextCursor: null,
                })
            })

        it("derives user fields, allocates ids, and rejects missing deletes",
            () => {
                expect(store.createUser({
                    ...scope, email: "new.user@example.test"
                })).toEqual({
                    id: 4, name: "new.user", email: "new.user@example.test",
                })
                expect(store.createUser({
                    ...scope, name: "Jane Doe"
                })).toEqual({
                    id: 5, name: "Jane Doe", email: "jane.doe@starci.dev",
                })
                expect(store.createUser({
                    ...scope
                })).toEqual({
                    id: 6, name: "User 6", email: "user.6@starci.dev",
                })

                store.deleteUser({
                    ...scope, userId: 1
                })
                expect(() => store.deleteUser({
                    ...scope, userId: 1
                })).toThrow()
            })

        it("patches users, supports simulated failures, and checks names case-insensitively",
            () => {
                expect(store.patchUser({
                    ...scope, userId: 1, name: "Renamed", fail: false
                })).toMatchObject({
                    id: 1, name: "Renamed",
                })
                expect(store.checkUsername({
                    ...scope, username: " renamed "
                })).toEqual({
                    available: false
                })
                expect(store.checkUsername({
                    ...scope, username: "available"
                })).toEqual({
                    available: true
                })
                expect(() => store.patchUser({
                    ...scope, userId: 1, name: "ignored", fail: true
                })).toThrow()
                expect(() => store.patchUser({
                    ...scope, userId: 99, name: "missing", fail: false
                })).toThrow()
            })

        it("creates invoices and resets a session to its seed",
            () => {
                expect(store.createInvoice({
                    ...scope,
                    customer: "Acme",
                    items: [
                        {
                            description: "first", quantity: 2, unitPrice: 12.5
                        },
                        {
                            description: "second", quantity: 1, unitPrice: 5
                        },
                    ],
                })).toEqual({
                    id: 1, total: 30
                })
                store.createInvoice({
                    ...scope, customer: "Acme", items: [{
                        description: "second", quantity: 1, unitPrice: 2
                    }]
                })
                store.createUser({
                    ...scope, name: "Temporary"
                })
                store.resetSession(scope)
                expect(store.getUsers(scope)).toHaveLength(3)
                expect(store.createInvoice({
                    ...scope, customer: "Acme", items: []
                })).toEqual({
                    id: 1, total: 0
                })
            })

        it("starts and stops the stale-session cleanup interval",
            () => {
                store.onModuleInit()
                expect(store["cleanupHandle"]).not.toBeNull()
                store.getUsers(scope)
                const sessions = store["sessions"]
                const staleSession = sessions.get(`${scope.moduleId}/${scope.lessonId}/${scope.sessionId}`)
                expect(staleSession).toBeDefined()
                if (staleSession === undefined) throw new Error("expected seeded session")
                staleSession.lastAccessedAt = Date.now() - (31 * 60 * 1000)
                jest.advanceTimersByTime(5 * 60 * 1000)
                expect(store.getUsers(scope)).toHaveLength(3)
                store.onModuleDestroy()
                expect(store["cleanupHandle"]).toBeNull()
            })
    })
