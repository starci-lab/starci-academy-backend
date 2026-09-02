import {
    parseDataGitDiff,
} from "../utils/parse-changed-paths"

/**
 * Scenario coverage for {@link parseDataGitDiff} -- the classifier that turns the
 * raw GitHub-compare changed-path list into a structured {@link DataGitDiff}.
 *
 * The compare API is status-agnostic (it returns filenames, not add/remove/modify),
 * so a create, an update and a delete of the same path all land on the SAME scope
 * here -- the actual create-vs-delete is reconciled downstream by the seeder upsert
 * + orphan-prune. The tests therefore assert "a change touching X -> scope Y" and
 * verify create/delete/update converge for representative entities.
 *
 * All paths assume the repo root IS the data root (`subdir = ""`) unless a test
 * exercises the subdir-stripping branch explicitly.
 */
describe("parseDataGitDiff",
    () => {
        /** Repo root is the data root for most cases. */
        const NO_SUBDIR = ""

        describe("course root",
            () => {
                it("maps a new course's root file to courseRootChanged (displayId = slug)",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/5-the-shop/master_plan.md",
                        ],
                        NO_SUBDIR)

                        expect([...diff.courseRootChanged]).toEqual([
                            "the-shop",
                        ])
                        expect(diff.fullReseed).toBe(false)
                    })

                it("treats create / update / delete of a course root file as the same scope",
                    () => {
                        // create (master_plan.md), update (vi.md), delete (en.md) -- all root touches
                        for (const file of [
                            "master_plan.md",
                            "vi.md",
                            "en.md",
                        ]) {
                            const diff = parseDataGitDiff([
                                `courses/0-fullstack-mastery/${file}`,
                            ],
                            NO_SUBDIR)
                            expect([...diff.courseRootChanged]).toEqual([
                                "fullstack-mastery",
                            ])
                        }
                    })

                it("strips a multi-digit order-index prefix to the displayId",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/12-system-design-mastery/master_plan.md",
                        ],
                        NO_SUBDIR)

                        expect(diff.courseRootChanged.has("system-design-mastery")).toBe(true)
                    })
            })

        describe("modules (content + challenges roll up to the module index)",
            () => {
                it.each([
                    [
                        "a module file",
                        "courses/0-fullstack-mastery/modules/4-server-state/index.yaml",
                    ],
                    [
                        "a content change",
                        "courses/0-fullstack-mastery/modules/4-server-state/contents/2-queries/en.md",
                    ],
                    [
                        "a challenge change",
                        "courses/0-fullstack-mastery/modules/4-server-state/contents/2-queries/challenges/1-cache-easy/vi.md",
                    ],
                ])(
                    "rolls %s up to its owning module index",
                    (
                        _label,
                        path,
                    ) => {
                        const diff = parseDataGitDiff([
                            path,
                        ],
                        NO_SUBDIR)

                        expect([...(diff.moduleIndicesByCourse.get("fullstack-mastery") ?? [])])
                            .toEqual([
                                4,
                            ])
                    })

                it("de-duplicates the module index across many files under the same module",
                    () => {
                        // a content edit + a challenge add under module 4 -> still just {4}
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/modules/4-server-state/contents/1-intro/en.md",
                            "courses/0-fullstack-mastery/modules/4-server-state/contents/1-intro/challenges/1-x-easy/vi.md",
                        ],
                        NO_SUBDIR)

                        expect([...(diff.moduleIndicesByCourse.get("fullstack-mastery") ?? [])])
                            .toEqual([
                                4,
                            ])
                    })

                it("collects multiple changed module indexes for one course",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/modules/4-server-state/en.md",
                            "courses/0-fullstack-mastery/modules/6-routing/en.md",
                        ],
                        NO_SUBDIR)

                        const indexes = [...(diff.moduleIndicesByCourse.get("fullstack-mastery") ?? [])]
                            .sort((a, b) => a - b)
                        expect(indexes).toEqual([
                            4,
                            6,
                        ])
                    })

                it("keeps changed modules separate per course",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/modules/4-server-state/en.md",
                            "courses/1-system-design-mastery/modules/2-caching/en.md",
                        ],
                        NO_SUBDIR)

                        expect([...(diff.moduleIndicesByCourse.get("fullstack-mastery") ?? [])])
                            .toEqual([
                                4,
                            ])
                        expect([...(diff.moduleIndicesByCourse.get("system-design-mastery") ?? [])])
                            .toEqual([
                                2,
                            ])
                    })

                it("falls back to a full reseed for a file straight under modules/ (no index dir)",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/modules/README.md",
                        ],
                        NO_SUBDIR)

                        expect(diff.fullReseed).toBe(true)
                    })
            })

        describe("milestones (tasks roll up to the milestone index)",
            () => {
                it("records the milestone order-index when a milestone file changes",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/milestones/1-project-foundation/index.yaml",
                        ],
                        NO_SUBDIR)

                        expect([...(diff.milestoneIndicesByCourse.get("fullstack-mastery") ?? [])])
                            .toEqual([
                                1,
                            ])
                        // a milestone change must NOT leak into the module map
                        expect(diff.moduleIndicesByCourse.has("fullstack-mastery")).toBe(false)
                    })

                it("rolls a milestone-task change up to its milestone index",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/milestones/1-project-foundation/tasks/2-clean-architecture/criteria.yaml",
                        ],
                        NO_SUBDIR)

                        expect([...(diff.milestoneIndicesByCourse.get("fullstack-mastery") ?? [])])
                            .toEqual([
                                1,
                            ])
                    })

                it("collects multiple changed milestone indexes (sorted, de-duplicated)",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/milestones/3-payments/en.md",
                            "courses/0-fullstack-mastery/milestones/1-project-foundation/en.md",
                            "courses/0-fullstack-mastery/milestones/1-project-foundation/tasks/0-x/y.yaml",
                        ],
                        NO_SUBDIR)

                        const indexes = [...(diff.milestoneIndicesByCourse.get("fullstack-mastery") ?? [])]
                            .sort((a, b) => a - b)
                        expect(indexes).toEqual([
                            1,
                            3,
                        ])
                    })
            })

        describe("flashcard decks",
            () => {
                it("gates the whole flashcard pass for the course (no index)",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/flashcard-decks/interview-prep.yaml",
                        ],
                        NO_SUBDIR)

                        expect(diff.flashcardChangedCourses.has("fullstack-mastery")).toBe(true)
                        // not a module/milestone/root touch
                        expect(diff.moduleIndicesByCourse.size).toBe(0)
                        expect(diff.courseRootChanged.size).toBe(0)
                    })
            })

        describe("standalone domains (top-level folders)",
            () => {
                it.each([
                    [
                        "foundations/categories/devops.yaml",
                        "foundations",
                    ],
                    [
                        "cv/john-doe/cv.pdf",
                        "cv",
                    ],
                    [
                        "templates/standard/template.yaml",
                        "cv",
                    ],
                    [
                        "headhuntings/acme-corp/info.yaml",
                        "headhunting",
                    ],
                    [
                        "coding-problems/two-sum/problem.md",
                        "codingProblems",
                    ],
                    [
                        "ai-models/catalog.yaml",
                        "aiModels",
                    ],
                    [
                        "subcriptions/tiers.yaml",
                        "subscriptions",
                    ],
                    [
                        "learner-plans/0-pro/en.md",
                        "subscriptions",
                    ],
                ])("maps %s → domain %s",
                    (path, domain) => {
                        const diff = parseDataGitDiff([
                            path,
                        ],
                        NO_SUBDIR)

                        expect([...diff.changedDomains]).toEqual([
                            domain,
                        ])
                        expect(diff.fullReseed).toBe(false)
                    })
            })

        describe("ignored, full-reseed + edge cases",
            () => {
                it("ignores authoring rules/ changes (no scope, no full reseed)",
                    () => {
                        const diff = parseDataGitDiff([
                            "rules/fullstack-v2.md",
                        ],
                        NO_SUBDIR)

                        expect(diff.fullReseed).toBe(false)
                        expect(diff.changedDomains.size).toBe(0)
                        expect(diff.courseRootChanged.size).toBe(0)
                    })

                it("flags a full reseed for an unknown top-level entry",
                    () => {
                        const diff = parseDataGitDiff([
                            "random/whatever.md",
                        ],
                        NO_SUBDIR)

                        expect(diff.fullReseed).toBe(true)
                    })

                it("returns an empty, scopable diff for no changes",
                    () => {
                        const diff = parseDataGitDiff([],
                            NO_SUBDIR)

                        expect(diff.fullReseed).toBe(false)
                        expect(diff.moduleIndicesByCourse.size).toBe(0)
                        expect(diff.milestoneIndicesByCourse.size).toBe(0)
                        expect(diff.courseRootChanged.size).toBe(0)
                        expect(diff.flashcardChangedCourses.size).toBe(0)
                        expect(diff.changedDomains.size).toBe(0)
                    })

                it("keeps fullReseed sticky once any path is unclassifiable",
                    () => {
                        // a valid module change cannot 'rescue' an unknown sibling path
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/modules/4-server-state/en.md",
                            "random/whatever.md",
                        ],
                        NO_SUBDIR)

                        expect(diff.fullReseed).toBe(true)
                        // the module is still recorded; the overlay layer decides to ignore it
                        expect(diff.moduleIndicesByCourse.get("fullstack-mastery")?.has(4)).toBe(true)
                    })

                it("classifies a mixed change-set (module + milestone + domain), ignoring rules",
                    () => {
                        const diff = parseDataGitDiff([
                            "courses/0-fullstack-mastery/modules/4-server-state/en.md",
                            "courses/0-fullstack-mastery/milestones/1-foundation/en.md",
                            "foundations/categories/x.yaml",
                            "rules/heroui-rules.md",
                        ],
                        NO_SUBDIR)

                        expect(diff.fullReseed).toBe(false)
                        expect(diff.moduleIndicesByCourse.get("fullstack-mastery")?.has(4)).toBe(true)
                        expect(diff.milestoneIndicesByCourse.get("fullstack-mastery")?.has(1)).toBe(true)
                        expect(diff.changedDomains.has("foundations")).toBe(true)
                    })
            })

        describe("subdir stripping",
            () => {
                /** Data lives under a `data/` sub-directory of the repo. */
                const SUBDIR = "data"

                it("classifies paths nested under the configured subdir",
                    () => {
                        const diff = parseDataGitDiff([
                            "data/courses/0-fullstack-mastery/modules/4-server-state/en.md",
                        ],
                        SUBDIR)

                        expect(diff.moduleIndicesByCourse.get("fullstack-mastery")?.has(4)).toBe(true)
                    })

                it("ignores paths outside the configured subdir (no scope, no full reseed)",
                    () => {
                        const diff = parseDataGitDiff([
                            "infra/docker-compose.yaml",
                            "data",
                        ],
                        SUBDIR)

                        expect(diff.fullReseed).toBe(false)
                        expect(diff.moduleIndicesByCourse.size).toBe(0)
                        expect(diff.changedDomains.size).toBe(0)
                    })
            })
    })
