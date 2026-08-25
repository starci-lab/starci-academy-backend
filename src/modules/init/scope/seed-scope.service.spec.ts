import {
    SeedScopeService 
} from "./seed-scope.service"

describe("SeedScopeService",
    () => {
        it("exposes seed switches and course index filters",
            () => {
                const config = {
                    seeders: {
                        enabled: true, courses: {
                            enabled: true, flashcard: {
                                enabled: false 
                            }, interview: {
                                enabled: true 
                            }, tracks: {
                                demo: {
                                    modules: [1,
                                        2], milestones: "all" 
                                } 
                            } 
                        }, cv: false, foundations: true, headhunting: false, aiModels: true, subscriptions: false, codingProblems: true, advertisements: false, changelog: true, blog: false, achievements: true, mockInterviewEq: false 
                    } 
                }
                const service = new SeedScopeService({
                    seedConfig: jest.fn().mockReturnValue(config) 
                } as never)
                expect(service.isSeedersEnabled()).toBe(true); expect(service.isCoursesSeederEnabled()).toBe(true); expect(service.isCoursesFlashcardSeederEnabled()).toBe(false); expect(service.isCoursesInterviewSeederEnabled()).toBe(true)
                const scope = service.resolveCourseSeedScope()
                expect(service.isFoundationsSeederEnabled()).toBe(true); expect((scope.moduleIndexFilterByDisplayId ?? new Map()).get("demo") ?? new Set<number>()).toEqual(new Set([1,
                    2]))
            })
    })
