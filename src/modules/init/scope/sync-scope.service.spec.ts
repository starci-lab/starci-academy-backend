import {
    SyncScopeService 
} from "./sync-scope.service"

describe("SyncScopeService",
    () => {
        it("builds sink-specific gates and index filters",
            () => {
                const config = {
                    synchronizers: {
                        enabled: true, reindex: ["Course"], courses: {
                            demo: {
                                course: true, modules: {
                                    cdn: [1], elasticsearch: "all", repo: [] 
                                }, milestones: {
                                    cdn: "all", elasticsearch: [2], repo: [] 
                                } 
                            } 
                        }, foundations: {
                            cdn: true, elasticsearch: false 
                        }, headhunting: {
                            cdn: false, elasticsearch: true 
                        }, flashcards: {
                            cdn: true, elasticsearch: true 
                        }, codingProblems: {
                            cdn: false, elasticsearch: false 
                        } 
                    } 
                }
                const service = new SyncScopeService({
                    seedConfig: jest.fn().mockReturnValue(config) 
                } as never)
                expect(service.isSynchronizersEnabled()).toBe(true); expect(service.reindexEntities()).toEqual(["Course"])
                expect(service.buildCdnScope()).toMatchObject({
                    courseEnabledByDisplayId: new Map([["demo",
                        true]]), foundations: true, headhunting: false, flashcards: true 
                })
                expect(service.buildElasticsearchScope()).toMatchObject({
                    moduleIndexFilterByDisplayId: new Map([["demo",
                        null]]), foundations: false, headhunting: true 
                })
                expect(service.buildRepoScope().foundations).toBe(false)
            })
    })
