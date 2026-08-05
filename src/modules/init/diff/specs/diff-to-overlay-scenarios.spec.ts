import {
    parseDataGitDiff,
} from "../utils/parse-changed-paths"
import {
    SeedDiffOverlayService,
} from "../seed-config-overlay.service"

/**
 * End-to-end scenarios wiring the two pure diff stages together:
 *
 *   changed paths -> {@link parseDataGitDiff} -> {@link SeedDiffOverlayService.buildDiffConfig}
 *
 * Each test reads as "this file change -> exactly this seed/sync scope", mirroring
 * how a real `StarCi-Academy/data` commit narrows the boot. Invariants checked
 * throughout: a partial diff NEVER reindexes (`synchronizers.reindex: []`) and
 * milestones never push to the repo sink (`repo: []`).
 */
describe("data-git diff → seed overlay (scenarios)",
    () => {
        let overlay: SeedDiffOverlayService

        beforeEach(() => {
            overlay = new SeedDiffOverlayService()
        })

        /** parse + build in one step, the way the orchestrator does. */
        const run = (paths: Array<string>) =>
            overlay.buildDiffConfig(parseDataGitDiff(paths,
                ""))

        it("content edit → only the owning module is synced, course root untouched, no reindex",
            () => {
                const result = run([
                    "courses/0-fullstack-mastery/modules/4-server-state/contents/2-queries/en.md",
                ])

                expect(result.overlay).not.toBeNull()
                expect(result.overlay?.seeders.courses.tracks["fullstack-mastery"]).toEqual({
                    // a content edit does not re-seed the course root
                    course: false,
                    modules: [
                        4,
                    ],
                    milestones: [],
                })
                expect(result.overlay?.synchronizers.courses["fullstack-mastery"].modules).toEqual({
                    cdn: [
                        4,
                    ],
                    elasticsearch: [
                        4,
                    ],
                    repo: [
                        4,
                    ],
                })
                // partial diff must never drop ES indices
                expect(result.overlay?.synchronizers.reindex).toEqual([])
                expect(result.courseCount).toBe(1)
                expect(result.moduleCount).toBe(1)
            })

        it("new course (root file) → re-seeds the course root",
            () => {
                const result = run([
                    "courses/5-the-shop/master_plan.md",
                ])

                expect(result.overlay?.seeders.courses.tracks["the-shop"]).toEqual({
                    course: true,
                    modules: [],
                    milestones: [],
                })
            })

        it("milestone edit → milestone index synced, but never pushed to the repo sink",
            () => {
                const result = run([
                    "courses/0-fullstack-mastery/milestones/1-project-foundation/tasks/2-x/criteria.yaml",
                ])

                const track = result.overlay?.synchronizers.courses["fullstack-mastery"]
                expect(track?.milestones).toEqual({
                    cdn: [
                        1,
                    ],
                    elasticsearch: [
                        1,
                    ],
                    // milestones are CDN/ES only -- repo push stays empty
                    repo: [],
                })
            })

        it("flashcard deck change → global flashcard pass on (seed + ES sink)",
            () => {
                const result = run([
                    "courses/0-fullstack-mastery/flashcard-decks/interview-prep.yaml",
                ])

                expect(result.overlay?.seeders.courses.flashcard.enabled).toBe(true)
                expect(result.overlay?.synchronizers.flashcards.elasticsearch).toBe(true)
            })

        it("standalone domain change (coding-problems) → that domain seeds + syncs",
            () => {
                const result = run([
                    "coding-problems/two-sum/problem.md",
                ])

                expect(result.overlay?.seeders.codingProblems).toBe(true)
                expect(result.overlay?.synchronizers.codingProblems.elasticsearch).toBe(true)
                expect(result.domainCount).toBe(1)
            })

        it("unknown path → full reseed (null overlay, no narrowed override applied)",
            () => {
                const result = run([
                    "random/whatever.md",
                ])

                expect(result.overlay).toBeNull()
                expect(result.courseCount).toBe(0)
                expect(result.moduleCount).toBe(0)
            })

        it("mixed change-set → counts reflect every touched course/module/domain",
            () => {
                const result = run([
                    "courses/0-fullstack-mastery/modules/4-server-state/en.md",
                    "courses/0-fullstack-mastery/modules/6-routing/en.md",
                    "courses/1-system-design-mastery/modules/2-caching/en.md",
                    "foundations/categories/x.yaml",
                ])

                expect(result.courseCount).toBe(2)
                // 4 + 6 (fullstack) + 2 (system-design) = 3 module indexes
                expect(result.moduleCount).toBe(3)
                expect(result.domainCount).toBe(1)
                expect(result.overlay?.synchronizers.reindex).toEqual([])
            })
    })
