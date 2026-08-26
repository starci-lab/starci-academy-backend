import {
    PresenceStoreService
} from "./presence-store.service"

describe("PresenceStoreService",
    () => {
        it("tracks first tabs, duplicate tabs, and room members",
            () => {
                const store = new PresenceStoreService()

                expect(store.addTab("room",
                    "alice",
                    "socket-1")).toEqual({
                    isFirstTab: true,
                    isLastTab: false,
                })
                expect(store.addTab("room",
                    "alice",
                    "socket-1")).toEqual({
                    isFirstTab: false,
                    isLastTab: false,
                })
                expect(store.addTab("room",
                    "alice",
                    "socket-2")).toEqual({
                    isFirstTab: false,
                    isLastTab: false,
                })
                expect(store.addTab("room",
                    "bob",
                    "socket-3")).toEqual({
                    isFirstTab: true,
                    isLastTab: false,
                })
                expect(store.members("room")).toEqual(["alice",
                    "bob"])
            })

        it("handles unknown removals and prunes the last tab and room",
            () => {
                const store = new PresenceStoreService()

                expect(store.removeTab("missing",
                    "alice",
                    "socket")).toEqual({
                    isFirstTab: false,
                    isLastTab: false,
                })
                store.addTab("room",
                    "alice",
                    "socket-1")
                expect(store.removeTab("room",
                    "alice",
                    "other")).toEqual({
                    isFirstTab: false,
                    isLastTab: false,
                })
                expect(store.members("room")).toEqual(["alice"])
                expect(store.removeTab("room",
                    "alice",
                    "socket-1")).toEqual({
                    isFirstTab: false,
                    isLastTab: true,
                })
                expect(store.members("room")).toEqual([])
            })
    })
