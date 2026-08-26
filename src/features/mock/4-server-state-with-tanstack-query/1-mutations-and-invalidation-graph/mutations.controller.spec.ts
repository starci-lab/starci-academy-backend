import {
    MutationsController
} from "./mutations.controller"

describe("MutationsController",
    () => {
        it("scopes reads and writes to the fixed lesson identifiers",
            () => {
                const store = {
                    getUsers: jest.fn().mockReturnValue([{
                        id: 1
                    }]),
                    createUser: jest.fn().mockReturnValue({
                        id: 2, name: "A"
                    }),
                    deleteUser: jest.fn(),
                }
                const controller = new MutationsController(store as never)

                expect(controller.getUsers("session-1")).toEqual([{
                    id: 1
                }])
                expect(controller.createUser("session-1",
                    {
                        name: "A", email: "a@test.dev"
                    })).toEqual({
                    id: 2, name: "A"
                })
                controller.deleteUser("session-1",
                    2)
                const scope = {
                    moduleId: "4-server-state-with-tanstack-query",
                    lessonId: "1-mutations-and-invalidation-graph",
                    sessionId: "session-1",
                }
                expect(store.getUsers).toHaveBeenCalledWith(scope)
                expect(store.createUser).toHaveBeenCalledWith({
                    ...scope, name: "A", email: "a@test.dev"
                })
                expect(store.deleteUser).toHaveBeenCalledWith({
                    ...scope, userId: 2
                })
            })
    })
