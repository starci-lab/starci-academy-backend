import {
    OptimisticController,
} from "./optimistic.controller"

describe("OptimisticController",
    () => {
        const store = {
            getUsers: jest.fn(),
            patchUser: jest.fn(),
        }
        const controller = new OptimisticController(store as never)

        beforeEach(() => jest.clearAllMocks())

        it("scopes user reads to the optimistic-update lesson",
            () => {
                const users = [{
                    id: 1, name: "Ada", email: "ada@example.test"
                }]
                store.getUsers.mockReturnValue(users)

                expect(controller.getUsers("session-1")).toBe(users)
                expect(store.getUsers).toHaveBeenCalledWith({
                    moduleId: "4-server-state-with-tanstack-query",
                    lessonId: "2-optimistic-updates-with-rollback",
                    sessionId: "session-1",
                })
            })

        it("forwards a normal patch and converts only the true query flag",
            () => {
                const updated = {
                    id: 2, name: "Grace", email: "grace@example.test"
                }
                store.patchUser.mockReturnValue(updated)

                expect(controller.patchUser("session-2",
                    2,
                    {
                        name: "Grace"
                    },
                    "true")).toBe(updated)
                expect(store.patchUser).toHaveBeenCalledWith(expect.objectContaining({
                    sessionId: "session-2",
                    userId: 2,
                    name: "Grace",
                    fail: true,
                }))

                controller.patchUser("session-2",
                    2,
                    {
                        name: "Grace"
                    },
                    "false")
                expect(store.patchUser).toHaveBeenLastCalledWith(expect.objectContaining({
                    fail: false
                }))
            })
    })
