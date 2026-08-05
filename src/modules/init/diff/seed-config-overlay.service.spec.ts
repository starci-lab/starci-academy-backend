import {
    SeedDiffOverlayService,
} from "./seed-config-overlay.service"
import type {
    DataGitDiff,
    DataGitDomain,
} from "./types"

/**
 * Build an empty (all-clean) {@link DataGitDiff}; each test mutates only the
 * field it exercises so the assertions stay focused on one signal at a time.
 */
const emptyDiff = (): DataGitDiff => ({
    fullReseed: false,
    moduleIndicesByCourse: new Map(),
    milestoneIndicesByCourse: new Map(),
    courseRootChanged: new Set(),
    flashcardChangedCourses: new Set(),
    changedDomains: new Set<DataGitDomain>(),
})

describe("SeedDiffOverlayService",
    () => {
        let service: SeedDiffOverlayService

        beforeEach(() => {
            // pure class, no DI graph -- construct it directly
            service = new SeedDiffOverlayService()
        })

        describe("buildFullConfig",
            () => {
                it("sets every given course to an `all` scope on both phases",
                    () => {
                        const config = service.buildFullConfig([
                            "fullstack-mastery",
                            "system-design-mastery",
                        ])

                        expect(config.seeders.enabled).toBe(true)
                        expect(config.seeders.courses.tracks["fullstack-mastery"]).toEqual({
                            course: true,
                            modules: "all",
                            milestones: "all",
                        })
                        expect(config.synchronizers.courses["system-design-mastery"]).toEqual({
                            course: true,
                            modules: {
                                cdn: "all",
                                elasticsearch: "all",
                                repo: "all",
                            },
                            milestones: {
                                cdn: "all",
                                elasticsearch: "all",
                                repo: [],
                            },
                        })
                    })

                it("keeps every standalone domain off + never reindexes (full path)",
                    () => {
                        const config = service.buildFullConfig([
                            "fullstack-mastery",
                        ])

                        expect(config.seeders.foundations).toBe(false)
                        expect(config.seeders.cv).toBe(false)
                        expect(config.seeders.codingProblems).toBe(false)
                        expect(config.seeders.courses.flashcard.enabled).toBe(false)
                        expect(config.synchronizers.flashcards.elasticsearch).toBe(false)
                        // coarse full path never drops indices -- only sync.reindex does
                        expect(config.synchronizers.reindex).toEqual([])
                    })
            })

        describe("buildDiffConfig",
            () => {
                it("returns a null overlay (full reseed) when the diff is unscopable",
                    () => {
                        const diff = emptyDiff()
                        diff.fullReseed = true

                        const result = service.buildDiffConfig(diff)

                        expect(result.overlay).toBeNull()
                        expect(result.courseCount).toBe(0)
                        expect(result.moduleCount).toBe(0)
                        expect(result.domainCount).toBe(0)
                    })

                it("narrows a course to only its changed module + milestone indexes",
                    () => {
                        const diff = emptyDiff()
                        diff.moduleIndicesByCourse.set("fullstack-mastery",
                            new Set([
                                2,
                                0,
                            ]))
                        diff.milestoneIndicesByCourse.set("fullstack-mastery",
                            new Set([
                                1,
                            ]))

                        const result = service.buildDiffConfig(diff)

                        // sorted, de-duplicated allow-lists
                        expect(result.overlay?.seeders.courses.tracks["fullstack-mastery"]).toEqual({
                            // root files did not change -> course root not re-seeded
                            course: false,
                            modules: [
                                0,
                                2,
                            ],
                            milestones: [
                                1,
                            ],
                        })
                        expect(result.courseCount).toBe(1)
                        expect(result.moduleCount).toBe(2)
                    })

                it("re-seeds the course root when its own files changed",
                    () => {
                        const diff = emptyDiff()
                        diff.courseRootChanged.add("devops-mastery")

                        const result = service.buildDiffConfig(diff)

                        expect(result.overlay?.seeders.courses.tracks["devops-mastery"]).toEqual({
                            course: true,
                            modules: [],
                            milestones: [],
                        })
                        // sync track always refreshes the catalog row
                        expect(result.overlay?.synchronizers.courses["devops-mastery"].course).toBe(true)
                    })

                it("enables the global flashcard pass when a course's decks changed",
                    () => {
                        const diff = emptyDiff()
                        diff.flashcardChangedCourses.add("fullstack-mastery")

                        const result = service.buildDiffConfig(diff)

                        expect(result.overlay?.seeders.courses.flashcard.enabled).toBe(true)
                        expect(result.overlay?.synchronizers.flashcards.elasticsearch).toBe(true)
                    })

                it("re-seeds + re-syncs a changed standalone domain (foundations)",
                    () => {
                        const diff = emptyDiff()
                        diff.changedDomains.add("foundations")

                        const result = service.buildDiffConfig(diff)

                        // a domain-only diff still produces a (non-null) scoped overlay
                        expect(result.overlay).not.toBeNull()
                        expect(result.overlay?.seeders.foundations).toBe(true)
                        expect(result.overlay?.synchronizers.foundations.elasticsearch).toBe(true)
                        expect(result.courseCount).toBe(0)
                        expect(result.domainCount).toBe(1)
                    })

                it("maps each changed domain onto its seed (+ sync) flag",
                    () => {
                        const diff = emptyDiff()
                        diff.changedDomains.add("cv")
                        diff.changedDomains.add("headhunting")
                        diff.changedDomains.add("codingProblems")

                        const result = service.buildDiffConfig(diff)

                        expect(result.overlay?.seeders.cv).toBe(true)
                        expect(result.overlay?.seeders.headhunting).toBe(true)
                        expect(result.overlay?.seeders.codingProblems).toBe(true)
                        expect(result.overlay?.synchronizers.cv.elasticsearch).toBe(true)
                        expect(result.overlay?.synchronizers.headhunting.elasticsearch).toBe(true)
                        expect(result.overlay?.synchronizers.codingProblems.elasticsearch).toBe(true)
                        expect(result.domainCount).toBe(3)
                    })

                it("enables seed-only catalog domains without a sync sink",
                    () => {
                        const diff = emptyDiff()
                        diff.changedDomains.add("aiModels")
                        diff.changedDomains.add("subscriptions")

                        const result = service.buildDiffConfig(diff)

                        // aiModels + subscriptions are seed-only -- no synchronizer field exists
                        expect(result.overlay?.seeders.aiModels).toBe(true)
                        expect(result.overlay?.seeders.subscriptions).toBe(true)
                        expect(result.domainCount).toBe(2)
                    })

                it("never reindexes on a partial diff (keeps unchanged ES data)",
                    () => {
                        const diff = emptyDiff()
                        diff.moduleIndicesByCourse.set("fullstack-mastery",
                            new Set([
                                0,
                            ]))

                        const result = service.buildDiffConfig(diff)

                        expect(result.overlay?.synchronizers.reindex).toEqual([])
                    })
            })
    })
