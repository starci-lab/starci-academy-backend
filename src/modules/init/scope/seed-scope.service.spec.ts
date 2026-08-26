import {
    SeedScopeService
} from "./seed-scope.service"

describe("SeedScopeService",
    () => {
        it("exposes seed switches and builds course index filters",
            () => {
                const config = {
                    seeders: {
                        enabled: true, courses: {
                            enabled: true, flashcard: {
                                enabled: false
                            }, interview: {
                                enabled: true
                            }, tracks: {
                                course: {
                                    modules: [1,
                                        2], milestones: [3]
                                }
                            }
                        }, cv: false, foundations: true, headhunting: false, aiModels: true, subscriptions: false, codingProblems: true, advertisements: false, changelog: false, blog: true, achievements: false, mockInterviewEq: true
                    }
                }
                const service = new SeedScopeService({
                    seedConfig: jest.fn().mockReturnValue(config)
                } as never)
                expect(service.isSeedersEnabled()).toBe(true)
                expect(service.isCoursesFlashcardSeederEnabled()).toBe(false)
                expect(service.isAiModelsCatalogSeederEnabled()).toBe(true)
                expect(service.resolveCourseSeedScope()?.moduleIndexFilterByDisplayId?.get("course")).toEqual(new Set([1,
                    2]))
            })
    })
