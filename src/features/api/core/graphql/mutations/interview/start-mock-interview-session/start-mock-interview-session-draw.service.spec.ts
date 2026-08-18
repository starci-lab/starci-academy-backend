import {
    FindOperator,
} from "typeorm"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MockInterviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    MockInterviewEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    UserContentEntity,
} from "@modules/databases/postgresql/primary/entities/user-content.entity"
import {
    ChallengeDifficulty,
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    FlashcardLevel,
} from "@modules/databases/postgresql/primary/enums/flashcard-level"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MockInterviewKind,
} from "@modules/databases/postgresql/primary/enums/mock-interview-kind"
import {
    MockInterviewMode,
} from "@modules/databases/postgresql/primary/enums/mock-interview-mode"
import {
    MockInterviewNoSeedCardsException,
} from "@modules/platform/exceptions/errors/ai/mock-interview-no-seed-cards"
import type {
    MockInterviewClassicPrompt,
} from "../../../queries/flashcard-decks/mock-interview-prompts/types/mock-interview-prompts"
import {
    MockInterviewSessionDrawService,
} from "./start-mock-interview-session-draw.service"
import type {
    DrawMockInterviewSessionParams,
} from "./types/start-mock-interview-session"

/**
 * Replaces the curated classic bank for the ONE case the real bank cannot produce:
 * a level whose difficulty pool matches no authored classic. The real bank spans
 * easy/medium/hard, so all three levels always find a classic and the draw's
 * last-resort "any classic at all" widening would never be exercised. Null means
 * "use the real constant", so every other test in this file runs against production
 * data.
 */
let mockClassicPromptBank: ReadonlyArray<MockInterviewClassicPrompt> | null = null

jest.mock("../../../queries/flashcard-decks/mock-interview-prompts/constants/classic-prompts",
    () => {
        const actual = jest.requireActual("../../../queries/flashcard-decks/mock-interview-prompts/constants/classic-prompts")
        return {
            get MOCK_INTERVIEW_CLASSIC_PROMPTS() {
                return mockClassicPromptBank ?? actual.MOCK_INTERVIEW_CLASSIC_PROMPTS
            },
        }
    })

/**
 * Guards how a question's authored `bodies/` decide whether the candidate's selected
 * implementation tracks gate it.
 *
 * The rule: a question authored across the four tracks is served in one of the
 * candidate's picked languages and dropped when none overlap, while a question with a
 * SINGLE authored body has its language fixed by the question itself (`agnostic` prose,
 * a `hcl`/`yaml`/`dockerfile` snippet -- or `typescript` code that only makes sense in
 * TypeScript) and must stay eligible for every candidate.
 *
 * Body COUNT, not the language label, is what separates the two. Gating a single-body
 * question on the track selection silently removes it from the pool for anyone who picked
 * a different track -- which is exactly what would happen to the 165 fixed-language code
 * questions (49 of them labelled `typescript`) once their content moves under `bodies/`.
 */
describe("MockInterviewSessionDrawService — track gating by body count",
    () => {
    /** Builds a bank row with the given authored bodies. */
        const question = (
            id: string,
            bodies: Array<{ lang: string, givenCode: string }>,
        ) => ({
            id,
            kind: "review",
            tier: "middle",
            moduleId: null,
            prompt: `prompt-${id}`,
            diagram: null,
            givenCode: null,
            givenLang: null,
            langs: bodies.map((body, index) => ({
                ...body,
                sortIndex: index,
                prompt: `prompt-${id}-${body.lang}`,
                idealAnswer: null,
            })),
        })

        /** Instantiates the service with only the dependency this path actually touches. */
        const serviceWith = (rows: Array<unknown>) => {
            const entityManager = {
                find: jest.fn().mockResolvedValue(rows),
            }
            return new MockInterviewSessionDrawService(
            entityManager as never,
            undefined as never,
            undefined as never,
            undefined as never,
            undefined as never,
            )
        }

        /** Calls the private lister the draw pool is built from. */
        const listFor = async (
            rows: Array<unknown>,
            langs: Array<string>,
        ) => {
            const service = serviceWith(rows)
            return await (service as unknown as {
            listCourseInterviewQuestions: (params: {
                courseId: string
                langs: Array<string>
            }) => Promise<Array<{ id: string, givenCodes: Array<{ lang: string }> }>>
        }).listCourseInterviewQuestions({
                courseId: "course-1",
                langs,
            })
        }

        it("keeps a single agnostic body for a candidate who picked an unrelated track",
            async () => {
                const rows = [question("q-agnostic",
                    [{
                        lang: "agnostic", givenCode: "",
                    }])]

                const result = await listFor(rows,
                    ["go"])

                expect(result.map((row) => row.id)).toEqual(["q-agnostic"])
            })

        it("keeps a single typescript body for a Java-only candidate (language fixed by the question)",
            async () => {
                const rows = [question("q-fixed-ts",
                    [{
                        lang: "typescript", givenCode: "const a = 1",
                    }])]

                const result = await listFor(rows,
                    ["java"])

                expect(result.map((row) => row.id)).toEqual(["q-fixed-ts"])
            })

        it("keeps a single hcl body regardless of the picked tracks",
            async () => {
                const rows = [question("q-hcl",
                    [{
                        lang: "hcl", givenCode: "resource \"x\" {}",
                    }])]

                const result = await listFor(rows,
                    ["csharp",
                        "go"])

                expect(result.map((row) => row.id)).toEqual(["q-hcl"])
            })

        it("serves a four-track question in a language the candidate actually picked",
            async () => {
                const rows = [question("q-track",
                    [
                        {
                            lang: "typescript", givenCode: "ts",
                        },
                        {
                            lang: "java", givenCode: "java",
                        },
                        {
                            lang: "csharp", givenCode: "cs",
                        },
                        {
                            lang: "go", givenCode: "go",
                        },
                    ])]

                const result = await listFor(rows,
                    ["go"])

                expect(result).toHaveLength(1)
                expect(result[0].givenCodes[0].lang).toBe("go")
            })

        it("drops a four-track question when none of its tracks were picked",
            async () => {
                const rows = [question("q-track",
                    [
                        {
                            lang: "typescript", givenCode: "ts",
                        },
                        {
                            lang: "java", givenCode: "java",
                        },
                    ])]

                const result = await listFor(rows,
                    ["go"])

                expect(result).toEqual([])
            })
    })

/** Id the persisted-session save echoes back, standing in for the generated primary key. */
const SESSION_ID = "session-1"

/** Creation timestamp the persisted-session save echoes back. */
const CREATED_AT = new Date("2026-08-19T00:00:00.000Z")

/** The trial enrollment every draw resolves to. */
const ENROLLMENT = {
    id: "enrollment-1",
}

/** One authored per-language body of an interview-bank question. */
interface BankBodyRow {
    /** Track language the body is authored in. */
    lang: string
    /** Given code delivered into the candidate's editor for this body, or null for a prose-only variant. */
    givenCode: string | null
    /** Authored order within the question's bodies. */
    sortIndex: number
    /** Per-language prompt override, or null to fall back to the parent prompt. */
    prompt: string | null
    /** Per-language ideal answer, unused by the draw. */
    idealAnswer: string | null
}

/** One `mock_interviews` row as the draw service reads it. */
interface BankRow {
    /** Row id. */
    id: string
    /** Authored cognitive frame. */
    kind: string
    /** Authored seniority tier, or null. */
    tier: string | null
    /** Owning module, or null for an unscoped question. */
    moduleId: string | null
    /** Root (agnostic) prompt text, or null when every body carries its own. */
    prompt: string | null
    /** Optional given diagram folded into the delivered question. */
    diagram: string | null
    /** Optional single given code for a non-track question. */
    givenCode: string | null
    /** Language of {@link BankRow.givenCode}, or null. */
    givenLang: string | null
    /** Per-language authored bodies; omitted for a root-authored question. */
    langs?: Array<BankBodyRow>
}

/** One `modules` row with its lessons, as the reached-module lookup reads it. */
interface ModuleRow {
    /** Module id. */
    id: string
    /** Lessons under this module; omitted to exercise the null-relation guard. */
    contents?: Array<{ id: string }>
}

/** One `milestone_tasks` row as the capstone lister reads it. */
interface TaskRow {
    /** Task id, reused as the drawn prompt id. */
    id: string
    /** Task title, reused as the drawn prompt title. */
    title: string
    /** Authored difficulty, or null to exercise the medium fallback. */
    difficulty: ChallengeDifficulty | null
}

/** One flashcard deck as `FlashcardDeckReadService.listByCourse` returns it. */
interface DeckRow {
    /** Deck topic, used as the RAG query that resolves the deck's module. */
    title: string
    /** Cards under the deck; omitted to exercise the null-relation guard. */
    cards?: Array<{ id: string, question: string, level: FlashcardLevel | null }>
}

/** Everything the draw service's collaborators resolve to for one test. */
interface DrawFixture {
    /** `modules` rows, in sort order. */
    modules: Array<ModuleRow>
    /** `user_contents` rows flagged read. */
    userContents: Array<{ contentId: string }>
    /** `mock_interviews` rows of family `technical`. */
    technical: Array<BankRow>
    /** `mock_interviews` rows of family `behavioral`. */
    behavioral: Array<BankRow & { family: string }>
    /** `milestone_tasks` rows. */
    milestoneTasks: Array<TaskRow>
    /** `contents` rows the deck-to-module RAG resolution looks up, keyed by id. */
    contentById: Record<string, { id: string, moduleId: string | null }>
    /** Decks the flashcard fallback source returns. */
    decks: Array<DeckRow>
    /** Hits the deck-to-module RAG search returns. */
    ragHits: Array<{ contentId: string, kind: string }>
    /** Capstone progress the personal-project service reports. */
    progress: {
        completionTasks: Array<{ id: string, completed: boolean, numAttempts: number }>
        currentTask: { id: string } | null
    }
}

/** Builds a draw service whose every collaborator is programmed from one fixture. */
const makeDrawHarness = (
    fixture: Partial<DrawFixture>,
) => {
    const entityManager = {
        find: jest.fn(async (
            entity: unknown,
            options?: { where?: Record<string, unknown> },
        ): Promise<Array<unknown>> => {
            if (entity === ModuleEntity) {
                return fixture.modules ?? []
            }
            if (entity === UserContentEntity) {
                return fixture.userContents ?? []
            }
            if (entity === MilestoneTaskEntity) {
                return fixture.milestoneTasks ?? []
            }
            if (entity === MockInterviewEntity) {
                if (options?.where?.family !== "behavioral") {
                    return fixture.technical ?? []
                }
                // the behavioral draw filters by `kind: In([...])` -- honour it so an
                // opener-only / closer-only bank can be expressed
                const wanted = (options.where.kind as FindOperator<string>).value
                return (fixture.behavioral ?? []).filter((row) => wanted.includes(row.kind))
            }
            return []
        }),
        findOne: jest.fn(async (
            entity: unknown,
            options: { where: { id: string } },
        ) => {
            if (entity !== ContentEntity) {
                return null
            }
            return fixture.contentById?.[options.where.id] ?? null
        }),
        update: jest.fn(async () => ({
            affected: 1,
        })),
        save: jest.fn(async (
            _entity: unknown,
            data: Record<string, unknown>,
        ) => ({
            ...data,
            id: SESSION_ID,
            createdAt: CREATED_AT,
        })),
    }
    const personalProjectProgressService = {
        getProgress: jest.fn(async () => fixture.progress ?? {
            completionTasks: [],
            currentTask: null,
        }),
    }
    const userService = {
        resolveOrCreateTrialEnrollment: jest.fn(async () => ENROLLMENT),
    }
    const flashcardDeckReadService = {
        listByCourse: jest.fn(async () => fixture.decks ?? []),
    }
    const contentRagRetrievalService = {
        searchCourse: jest.fn(async () => ({
            hits: fixture.ragHits ?? [],
        })),
    }
    const service = new MockInterviewSessionDrawService(
        entityManager as never,
        personalProjectProgressService as never,
        userService as never,
        flashcardDeckReadService as never,
        contentRagRetrievalService as never,
    )
    return {
        service,
        entityManager,
        personalProjectProgressService,
        userService,
        flashcardDeckReadService,
        contentRagRetrievalService,
    }
}

/** Builds draw params, defaulting every optional field to the Auto/Auto request. */
const drawParams = (
    overrides: Partial<DrawMockInterviewSessionParams> = {
    },
): DrawMockInterviewSessionParams => ({
    userId: "user-1",
    courseId: "course-1",
    level: "middle",
    mode: "qna",
    locale: Locale.En,
    ...overrides,
})

/** Builds an interview-bank row, defaulting to a root-authored non-code question. */
const bankRow = (
    overrides: Partial<BankRow> & { id: string },
): BankRow => ({
    kind: "theory",
    tier: "middle",
    moduleId: null,
    prompt: `prompt-${overrides.id}`,
    diagram: null,
    givenCode: null,
    givenLang: null,
    ...overrides,
})

/**
 * The design draw is the integrity fix that moved prompt selection off the client:
 * it prefers capstone work the learner has actually REACHED, falls back to curated
 * classics of the same difficulty, and widens to any classic rather than ever
 * returning empty. Every path also persists the session so grading can look the
 * server's own choice back up.
 */
describe("MockInterviewSessionDrawService — design mode draw",
    () => {
        beforeEach(() => {
            // pickRandom/pickRandomMany both consume Math.random; pin it so the drawn
            // element is the one the test names rather than a coin flip
            jest.spyOn(Math,
                "random").mockReturnValue(0)
        })

        afterEach(() => {
            jest.restoreAllMocks()
            mockClassicPromptBank = null
        })

        it("draws a reached capstone task and persists it as the session's server-held prompt",
            async () => {
                const harness = makeDrawHarness({
                    milestoneTasks: [{
                        id: "task-1",
                        title: "Build the ingestion pipeline",
                        difficulty: ChallengeDifficulty.Medium,
                    }],
                    progress: {
                        completionTasks: [{
                            id: "task-1",
                            completed: true,
                            numAttempts: 0,
                        }],
                        currentTask: null,
                    },
                })

                const result = await harness.service.draw(drawParams({
                    mode: "design",
                }))

                expect(result).toMatchObject({
                    sessionId: SESSION_ID,
                    promptId: "task-1",
                    promptTitle: "Build the ingestion pipeline",
                    difficulty: ChallengeDifficulty.Medium,
                    source: "capstone",
                    level: "middle",
                    mode: MockInterviewMode.Design,
                    seedTopics: [],
                    createdAt: CREATED_AT,
                })
                expect(harness.entityManager.save).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    expect.objectContaining({
                        promptId: "task-1",
                        mode: MockInterviewMode.Design,
                        source: "capstone",
                        seedQuestions: null,
                        status: "in_progress",
                    }),
                )
            })

        it("counts an attempted-but-unfinished capstone task as reached",
            async () => {
                const harness = makeDrawHarness({
                    milestoneTasks: [{
                        id: "task-attempted",
                        title: "Attempted task",
                        difficulty: ChallengeDifficulty.Medium,
                    }],
                    progress: {
                        completionTasks: [{
                            id: "task-attempted",
                            completed: false,
                            numAttempts: 2,
                        }],
                        currentTask: null,
                    },
                })

                const result = await harness.service.draw(drawParams({
                    mode: "design",
                }))

                expect(result.promptId).toBe("task-attempted")
            })

        it("counts the learner's current task as reached even with no attempts recorded",
            async () => {
                const harness = makeDrawHarness({
                    milestoneTasks: [{
                        id: "task-current",
                        title: "Current task",
                        difficulty: null,
                    }],
                    progress: {
                        completionTasks: [],
                        currentTask: {
                            id: "task-current",
                        },
                    },
                })

                const result = await harness.service.draw(drawParams({
                    mode: "design",
                }))

                // difficulty is null on the row -- the draw reports the medium fallback
                expect(result).toMatchObject({
                    promptId: "task-current",
                    difficulty: ChallengeDifficulty.Medium,
                    source: "capstone",
                })
            })

        it("falls back to a classic when the only capstone task is still locked",
            async () => {
                const harness = makeDrawHarness({
                    milestoneTasks: [{
                        id: "task-locked",
                        title: "Locked task",
                        difficulty: ChallengeDifficulty.Medium,
                    }],
                    progress: {
                        completionTasks: [{
                            id: "task-locked",
                            completed: false,
                            numAttempts: 0,
                        }],
                        currentTask: {
                            id: "task-other",
                        },
                    },
                })

                const result = await harness.service.draw(drawParams({
                    mode: "design",
                }))

                expect(result.source).toBe("classic")
                expect(result.difficulty).toBe(ChallengeDifficulty.Medium)
            })

        it("excludes a reached capstone task whose difficulty is outside the level's pool",
            async () => {
                const harness = makeDrawHarness({
                    milestoneTasks: [{
                        id: "task-easy",
                        title: "Warm-up task",
                        difficulty: ChallengeDifficulty.Easy,
                    }],
                    progress: {
                        completionTasks: [{
                            id: "task-easy",
                            completed: true,
                            numAttempts: 3,
                        }],
                        currentTask: null,
                    },
                })

                // a senior session must never draw an easy warm-up prompt
                const result = await harness.service.draw(drawParams({
                    mode: "design",
                    level: "senior",
                }))

                expect(result.source).toBe("classic")
                expect(result.difficulty).toBe(ChallengeDifficulty.Hard)
            })

        it("skips the progress lookup entirely when the course has no capstone tasks",
            async () => {
                const harness = makeDrawHarness({
                    milestoneTasks: [],
                })

                const result = await harness.service.draw(drawParams({
                    mode: "design",
                    level: "junior",
                }))

                expect(harness.personalProjectProgressService.getProgress).not.toHaveBeenCalled()
                expect(result.source).toBe("classic")
                expect(result.difficulty).toBe(ChallengeDifficulty.Easy)
            })

        it("renders the drawn classic's title in the requested locale",
            async () => {
                const english = makeDrawHarness({
                })
                const vietnamese = makeDrawHarness({
                })

                const englishResult = await english.service.draw(drawParams({
                    mode: "design",
                    locale: Locale.En,
                }))
                const vietnameseResult = await vietnamese.service.draw(drawParams({
                    mode: "design",
                    locale: Locale.Vi,
                }))

                expect(englishResult.promptId).toBe(vietnameseResult.promptId)
                expect(englishResult.promptTitle).not.toBe(vietnameseResult.promptTitle)
                expect(englishResult.promptTitle).toBe("Design a distributed key-value store")
            })

        it("widens to any classic when the bank has none at the level's difficulty",
            async () => {
                mockClassicPromptBank = [{
                    id: "classic-only-easy",
                    difficulty: ChallengeDifficulty.Easy,
                    title: {
                        [Locale.En]: "Design a counter",
                        [Locale.Vi]: "Counter",
                    },
                }]
                const harness = makeDrawHarness({
                })

                // senior draws hard/insane -- the stand-in bank has neither
                const result = await harness.service.draw(drawParams({
                    mode: "design",
                    level: "senior",
                }))

                expect(result).toMatchObject({
                    promptId: "classic-only-easy",
                    difficulty: ChallengeDifficulty.Easy,
                    source: "classic",
                    level: "senior",
                })
            })

        it("forces countsToReadiness on even when the client asked for a practice-only design run",
            async () => {
                const harness = makeDrawHarness({
                })

                await harness.service.draw(drawParams({
                    mode: "design",
                    countsToReadiness: false,
                }))

                expect(harness.entityManager.save).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    expect.objectContaining({
                        countsToReadiness: true,
                    }),
                )
            })

        it("retires the enrollment's previous in-flight draw before persisting the new one",
            async () => {
                const harness = makeDrawHarness({
                })

                await harness.service.draw(drawParams({
                    mode: "design",
                }))

                expect(harness.entityManager.update).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    {
                        enrollment: {
                            id: ENROLLMENT.id,
                        },
                        status: "in_progress",
                    },
                    {
                        status: "abandoned",
                    },
                )
                expect(harness.entityManager.update.mock.invocationCallOrder[0])
                    .toBeLessThan(harness.entityManager.save.mock.invocationCallOrder[0])
            })

        it("anchors the draw to the trial enrollment resolved once for the user and course",
            async () => {
                const harness = makeDrawHarness({
                })

                await harness.service.draw(drawParams({
                    mode: "design",
                    userId: "user-42",
                    courseId: "course-9",
                }))

                expect(harness.userService.resolveOrCreateTrialEnrollment).toHaveBeenCalledTimes(1)
                expect(harness.userService.resolveOrCreateTrialEnrollment).toHaveBeenCalledWith(
                    "user-42",
                    "course-9",
                )
            })

        it("stores a trimmed session name and nulls a blank one",
            async () => {
                const named = makeDrawHarness({
                })
                const blank = makeDrawHarness({
                })

                await named.service.draw(drawParams({
                    mode: "design",
                    name: "  Friday practice  ",
                }))
                await blank.service.draw(drawParams({
                    mode: "design",
                    name: "   ",
                }))

                expect(named.entityManager.save).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    expect.objectContaining({
                        name: "Friday practice",
                        lang: null,
                    }),
                )
                expect(blank.entityManager.save).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    expect.objectContaining({
                        name: null,
                    }),
                )
            })
    })

/**
 * The qna draw seeds N questions out of the authored interview bank, falling back to
 * flashcards for courses with no bank yet, and never dead-ends: it widens the pool
 * from "reached modules at this level" outward until there is real variety to draw
 * from. A course with nothing to draw at all must fail loudly instead of persisting
 * an empty session.
 */
describe("MockInterviewSessionDrawService — qna mode draw",
    () => {
        beforeEach(() => {
            jest.spyOn(Math,
                "random").mockReturnValue(0)
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        it("draws bank questions verbatim, keeping each question's authored kind",
            async () => {
                const harness = makeDrawHarness({
                    technical: [
                        bankRow({
                            id: "q-1",
                            kind: "debug",
                            prompt: "Find the leak",
                            diagram: "graph TD; a-->b",
                            givenCode: "let x = 1",
                            givenLang: "typescript",
                        }),
                        bankRow({
                            id: "q-2",
                            kind: "reasoning",
                            prompt: "Queue or cron?",
                        }),
                    ],
                })

                const result = await harness.service.draw(drawParams({
                    questionCount: 3,
                }))

                expect(result.source).toBe("interview-bank")
                expect(result.mode).toBe(MockInterviewMode.Qna)
                const byId = new Map(result.seedTopics.map((topic) => [topic.cardId,
                    topic]))
                // the diagram is folded into the delivered question, the given code is not
                expect(byId.get("q-1")).toEqual({
                    cardId: "q-1",
                    kind: "debug",
                    title: "Find the leak\n\ngraph TD; a-->b",
                    givenCodes: [{
                        lang: "typescript",
                        code: "let x = 1",
                    }],
                })
                expect(byId.get("q-2")).toEqual({
                    cardId: "q-2",
                    kind: "reasoning",
                    title: "Queue or cron?",
                    givenCodes: [],
                })
            })

        it("labels the session with the drawn question count and the pool's difficulty",
            async () => {
                const harness = makeDrawHarness({
                    technical: [
                        bankRow({
                            id: "q-1",
                        }),
                        bankRow({
                            id: "q-2",
                        }),
                        bankRow({
                            id: "q-3",
                        }),
                    ],
                })

                const result = await harness.service.draw(drawParams({
                    level: "senior",
                    questionCount: 3,
                }))

                expect(result.seedTopics).toHaveLength(3)
                expect(result.promptId).toMatch(/^qna-enrollment-1-\d+$/)
                expect(result.promptTitle).toBe("3 câu · Ngẫu nhiên") // vn-ok: the service emits this localized title to clients
                expect(result.difficulty).toBe(ChallengeDifficulty.Hard)
            })

        it("maps junior and middle levels onto their own difficulty tiers",
            async () => {
                const junior = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                })
                const middle = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                })

                const juniorResult = await junior.service.draw(drawParams({
                    level: "junior",
                }))
                const middleResult = await middle.service.draw(drawParams({
                    level: "middle",
                }))

                expect(juniorResult.difficulty).toBe(ChallengeDifficulty.Easy)
                expect(middleResult.difficulty).toBe(ChallengeDifficulty.Medium)
            })

        it("strips a wrapping markdown fence off authored given code and leaves unfenced code alone",
            async () => {
                const harness = makeDrawHarness({
                    technical: [
                        bankRow({
                            id: "q-fenced",
                            givenCode: "```ts\nconst a = 1\n```",
                            givenLang: "typescript",
                        }),
                        bankRow({
                            id: "q-plain",
                            givenCode: "const b = 2",
                        }),
                    ],
                })

                const result = await harness.service.draw(drawParams({
                    questionCount: 3,
                }))

                const byId = new Map(result.seedTopics.map((topic) => [topic.cardId,
                    topic]))
                expect(byId.get("q-fenced")?.givenCodes).toEqual([{
                    lang: "typescript",
                    code: "const a = 1",
                }])
                // no authored givenLang -- the variant is labelled agnostic
                expect(byId.get("q-plain")?.givenCodes).toEqual([{
                    lang: "agnostic",
                    code: "const b = 2",
                }])
            })

        it("delivers a per-language body's own prompt and falls back to the parent prompt when it has none",
            async () => {
                const harness = makeDrawHarness({
                    technical: [
                        bankRow({
                            id: "q-body-prompt",
                            prompt: "root prompt",
                            langs: [{
                                lang: "go",
                                givenCode: "package main",
                                sortIndex: 0,
                                prompt: "go prompt",
                                idealAnswer: null,
                            }],
                        }),
                        bankRow({
                            id: "q-root-prompt",
                            prompt: "root prompt only",
                            langs: [{
                                lang: "go",
                                givenCode: "package main",
                                sortIndex: 0,
                                prompt: null,
                                idealAnswer: null,
                            }],
                        }),
                    ],
                })

                const result = await harness.service.draw(drawParams({
                    langs: ["go"],
                    questionCount: 3,
                }))

                const byId = new Map(result.seedTopics.map((topic) => [topic.cardId,
                    topic]))
                expect(byId.get("q-body-prompt")?.title).toBe("go prompt")
                expect(byId.get("q-root-prompt")?.title).toBe("root prompt only")
            })

        it("delivers an empty question when neither the body nor the parent authored a prompt",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-empty",
                        prompt: null,
                        langs: [{
                            lang: "go",
                            givenCode: "package main",
                            sortIndex: 0,
                            prompt: null,
                            idealAnswer: null,
                        }],
                    })],
                })

                const result = await harness.service.draw(drawParams({
                    langs: ["go"],
                }))

                expect(result.seedTopics[0].title).toBe("")
            })

        it("delivers an empty question for a root-authored question with no prompt at all",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-bare",
                        prompt: null,
                    })],
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics[0]).toEqual({
                    cardId: "q-bare",
                    kind: "theory",
                    title: "",
                    givenCodes: [],
                })
            })

        it("folds a given diagram into a track-authored question's delivered text",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-track-diagram",
                        prompt: "root prompt",
                        diagram: "graph LR; a-->b",
                        langs: [{
                            lang: "go",
                            givenCode: "package main",
                            sortIndex: 0,
                            prompt: "go prompt",
                            idealAnswer: null,
                        }],
                    })],
                })

                const result = await harness.service.draw(drawParams({
                    langs: ["go"],
                }))

                expect(result.seedTopics[0].title).toBe("go prompt\n\ngraph LR; a-->b")
            })

        it("keeps a body's raw given code when there is no fence to strip off it",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-no-code",
                        langs: [{
                            lang: "go",
                            givenCode: null,
                            sortIndex: 0,
                            prompt: "go prompt",
                            idealAnswer: null,
                        }],
                    })],
                })

                const result = await harness.service.draw(drawParams({
                    langs: ["go"],
                }))

                expect(result.seedTopics[0].givenCodes).toEqual([{
                    lang: "go",
                    code: null,
                }])
            })

        it("serves a multi-track question in the first authored body order, honouring sortIndex",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-track",
                        langs: [
                            {
                                lang: "java",
                                givenCode: "java code",
                                sortIndex: 1,
                                prompt: "java prompt",
                                idealAnswer: null,
                            },
                            {
                                lang: "go",
                                givenCode: "go code",
                                sortIndex: 0,
                                prompt: "go prompt",
                                idealAnswer: null,
                            },
                        ],
                    })],
                })

                const result = await harness.service.draw(drawParams({
                    langs: ["java",
                        "go"],
                }))

                // sorted by sortIndex, then Math.random pinned to 0 picks the first
                expect(result.seedTopics[0]).toMatchObject({
                    title: "go prompt",
                    givenCodes: [{
                        lang: "go",
                        code: "go code",
                    }],
                })
            })

        it("picks a different authored body when the random draw lands at the other end",
            async () => {
                jest.spyOn(Math,
                    "random").mockReturnValue(0.99)
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-track",
                        langs: [
                            {
                                lang: "go",
                                givenCode: "go code",
                                sortIndex: 0,
                                prompt: "go prompt",
                                idealAnswer: null,
                            },
                            {
                                lang: "java",
                                givenCode: "java code",
                                sortIndex: 1,
                                prompt: "java prompt",
                                idealAnswer: null,
                            },
                        ],
                    })],
                })

                const result = await harness.service.draw(drawParams({
                    langs: ["java",
                        "go"],
                }))

                expect(result.seedTopics[0].givenCodes).toEqual([{
                    lang: "java",
                    code: "java code",
                }])
            })

        it("persists the first selected track language as the session's representative language",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                })

                await harness.service.draw(drawParams({
                    langs: ["go",
                        "java"],
                }))

                expect(harness.entityManager.save).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    expect.objectContaining({
                        lang: "java",
                    }),
                )
            })

        it("snapshots every drawn seed onto the persisted session so a resume re-seeds the same code",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                        kind: "debug",
                        prompt: "Fix it",
                        givenCode: "broken()",
                        givenLang: "go",
                    })],
                })

                await harness.service.draw(drawParams({
                }))

                expect(harness.entityManager.save).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    expect.objectContaining({
                        source: "interview-bank",
                        mode: MockInterviewMode.Qna,
                        seedQuestions: [{
                            cardId: "q-1",
                            kind: "debug",
                            title: "Fix it",
                            givenCodes: [{
                                lang: "go",
                                code: "broken()",
                            }],
                        }],
                    }),
                )
            })

        it("rejects a course with neither a bank nor flashcards instead of persisting an empty session",
            async () => {
                // hand Math.random back before provoking a throw: jest source-maps the
                // rejection's stack with a randomized-pivot quicksort, which degenerates
                // into unbounded recursion while every "random" pivot is pinned to 0
                jest.restoreAllMocks()
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [],
                })

                await expect(harness.service.draw(drawParams({
                    courseId: "course-empty",
                }))).rejects.toThrow(MockInterviewNoSeedCardsException)
                expect(harness.entityManager.save).not.toHaveBeenCalled()
            })

        it("honours a practice-only qna draw by persisting countsToReadiness false",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                })

                await harness.service.draw(drawParams({
                    countsToReadiness: false,
                }))

                expect(harness.entityManager.save).toHaveBeenCalledWith(
                    MockInterviewSessionEntity,
                    expect.objectContaining({
                        countsToReadiness: false,
                    }),
                )
            })

        it("treats an unrecognized mode string as a qna draw",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                })

                const result = await harness.service.draw(drawParams({
                    mode: "whiteboard",
                }))

                expect(result.mode).toBe(MockInterviewMode.Qna)
            })
    })

/**
 * How wide the qna pool opens. Reached-at-level cards come first, but a pool too thin
 * to shuffle would lock every retry onto the same one or two cards, so thinner tiers
 * are topped up from the next one rather than replaced.
 */
describe("MockInterviewSessionDrawService — qna pool widening",
    () => {
        beforeEach(() => {
            jest.spyOn(Math,
                "random").mockReturnValue(0)
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        /** Five middle-tier cards under `module-reached`, plus one unreached and one unscoped. */
        const wideBank = (): Array<BankRow> => [
            bankRow({
                id: "r-1", moduleId: "module-reached",
            }),
            bankRow({
                id: "r-2", moduleId: "module-reached",
            }),
            bankRow({
                id: "r-3", moduleId: "module-reached",
            }),
            bankRow({
                id: "r-4", moduleId: "module-reached",
            }),
            bankRow({
                id: "r-5", moduleId: "module-reached",
            }),
            bankRow({
                id: "u-1", moduleId: "module-locked",
            }),
            bankRow({
                id: "n-1", moduleId: null,
            }),
        ]

        it("never widens past the reached-at-level tier once it already holds enough cards",
            async () => {
                const harness = makeDrawHarness({
                    technical: wideBank(),
                    // the reached module still has an unread lesson, so it -- not the
                    // one after it -- is the learner's current module
                    modules: [
                        {
                            id: "module-reached",
                            contents: [
                                {
                                    id: "content-1",
                                },
                                {
                                    id: "content-1b",
                                },
                            ],
                        },
                        {
                            id: "module-locked",
                            contents: [{
                                id: "content-2",
                            }],
                        },
                    ],
                    userContents: [{
                        contentId: "content-1",
                    }],
                })

                const result = await harness.service.draw(drawParams({
                    questionCount: 5,
                }))

                const drawn = result.seedTopics.map((topic) => topic.cardId).sort()
                expect(drawn).toEqual([
                    "r-1",
                    "r-2",
                    "r-3",
                    "r-4",
                    "r-5",
                ])
            })

        it("tops a thin reached-at-level tier up from the wider tiers rather than locking onto one card",
            async () => {
                const harness = makeDrawHarness({
                    technical: [
                        bankRow({
                            id: "at-level", moduleId: "module-reached",
                        }),
                        bankRow({
                            id: "wrong-level", moduleId: "module-reached", tier: "senior",
                        }),
                        bankRow({
                            id: "unreached", moduleId: "module-locked",
                        }),
                    ],
                    modules: [
                        {
                            id: "module-reached",
                            contents: [
                                {
                                    id: "content-1",
                                },
                                {
                                    id: "content-1b",
                                },
                            ],
                        },
                        {
                            id: "module-locked",
                            contents: [{
                                id: "content-2",
                            }],
                        },
                    ],
                    userContents: [{
                        contentId: "content-1",
                    }],
                })

                const result = await harness.service.draw(drawParams({
                    questionCount: 3,
                }))

                const drawn = result.seedTopics.map((topic) => topic.cardId).sort()
                expect(drawn).toEqual([
                    "at-level",
                    "unreached",
                    "wrong-level",
                ])
            })

        it("widens a senior draw across both the senior and staff tiers",
            async () => {
                const harness = makeDrawHarness({
                    technical: [
                        bankRow({
                            id: "s-1", moduleId: "module-reached", tier: "senior",
                        }),
                        bankRow({
                            id: "j-1", moduleId: "module-reached", tier: "junior",
                        }),
                    ],
                    modules: [{
                        id: "module-reached",
                        contents: [{
                            id: "content-1",
                        }],
                    }],
                    userContents: [{
                        contentId: "content-1",
                    }],
                })

                const result = await harness.service.draw(drawParams({
                    level: "senior",
                    questionCount: 3,
                }))

                // the junior card is out of tier but still tops the pool up
                expect(result.seedTopics.map((topic) => topic.cardId).sort()).toEqual([
                    "j-1",
                    "s-1",
                ])
            })
    })

/**
 * Which modules a learner counts as having REACHED. A module is reached once it has a
 * read lesson, and the FIRST module still carrying an unread lesson is the one the
 * learner is currently in -- every module after that stays locked.
 */
describe("MockInterviewSessionDrawService — reached module resolution",
    () => {
        beforeEach(() => {
            jest.spyOn(Math,
                "random").mockReturnValue(0)
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        /** Runs the private reached-module lookup for the given module/read-flag rows. */
        const reachedFor = async (
            fixture: Partial<DrawFixture>,
        ) => {
            const harness = makeDrawHarness(fixture)
            const reached = await (harness.service as unknown as {
                listReachedModuleIds: (params: {
                    courseId: string
                    enrollmentId: string
                }) => Promise<Set<string>>
            }).listReachedModuleIds({
                courseId: "course-1",
                enrollmentId: ENROLLMENT.id,
            })
            return {
                reached,
                harness,
            }
        }

        it("returns nothing and never reads the read-flags when the course has no modules",
            async () => {
                const { reached, harness } = await reachedFor({
                    modules: [],
                })

                expect([...reached]).toEqual([])
                expect(harness.entityManager.find).not.toHaveBeenCalledWith(
                    UserContentEntity,
                    expect.anything(),
                )
            })

        it("grants the current-module status to the first module with an unread lesson only",
            async () => {
                const { reached } = await reachedFor({
                    modules: [
                        {
                            id: "module-1",
                            contents: [{
                                id: "content-1",
                            }],
                        },
                        {
                            id: "module-2",
                            contents: [{
                                id: "content-2",
                            }],
                        },
                        {
                            id: "module-3",
                            contents: [{
                                id: "content-3",
                            }],
                        },
                    ],
                    userContents: [],
                })

                expect([...reached]).toEqual(["module-1"])
            })

        it("reaches a fully-read module and still claims the next unread one",
            async () => {
                const { reached } = await reachedFor({
                    modules: [
                        {
                            id: "module-1",
                            contents: [{
                                id: "content-1",
                            }],
                        },
                        {
                            id: "module-2",
                            contents: [{
                                id: "content-2",
                            }],
                        },
                        {
                            id: "module-3",
                            contents: [{
                                id: "content-3",
                            }],
                        },
                    ],
                    userContents: [{
                        contentId: "content-1",
                    }],
                })

                expect([...reached].sort()).toEqual([
                    "module-1",
                    "module-2",
                ])
            })

        it("reaches a partially-read module once, without double-adding it as the current one",
            async () => {
                const { reached } = await reachedFor({
                    modules: [{
                        id: "module-1",
                        contents: [
                            {
                                id: "content-1",
                            },
                            {
                                id: "content-2",
                            },
                        ],
                    }],
                    userContents: [{
                        contentId: "content-1",
                    }],
                })

                expect([...reached]).toEqual(["module-1"])
            })

        it("reaches no module when every module is lessonless",
            async () => {
                const { reached, harness } = await reachedFor({
                    modules: [{
                        id: "module-empty",
                    }],
                })

                expect([...reached]).toEqual([])
                expect(harness.entityManager.find).not.toHaveBeenCalledWith(
                    UserContentEntity,
                    expect.anything(),
                )
            })
    })

/**
 * The flashcard fallback for courses whose interview bank is not authored yet. Each
 * deck's owning module is derived via RAG rather than stored, and a card's cognitive
 * frame is derived deterministically from its own id instead of drawn at random.
 */
describe("MockInterviewSessionDrawService — flashcard seed fallback",
    () => {
        beforeEach(() => {
            jest.spyOn(Math,
                "random").mockReturnValue(0)
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        it("truncates a long flashcard question into a preview title and derives its kind",
            async () => {
                const longQuestion = "q".repeat(200)
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "Indexing",
                        cards: [{
                            id: "card-1",
                            question: `  ${longQuestion}  `,
                            level: FlashcardLevel.Middle,
                        }],
                    }],
                    ragHits: [{
                        contentId: "content-1",
                        kind: "content",
                    }],
                    contentById: {
                        "content-1": {
                            id: "content-1",
                            moduleId: "module-1",
                        },
                    },
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.source).toBe("flashcard")
                expect(result.seedTopics).toHaveLength(1)
                expect(result.seedTopics[0].title).toHaveLength(121)
                expect(result.seedTopics[0].title.endsWith("…")).toBe(true)
                expect(result.seedTopics[0].givenCodes).toEqual([])
                expect(Object.values(MockInterviewKind)).toContain(result.seedTopics[0].kind)
                expect(harness.flashcardDeckReadService.listByCourse).toHaveBeenCalledWith(
                    "course-1",
                    Locale.En,
                )
            })

        it("keeps a short flashcard question untouched as its title",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "Indexing",
                        cards: [{
                            id: "card-1",
                            question: "  What is a covering index?  ",
                            level: FlashcardLevel.Middle,
                        }],
                    }],
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics[0].title).toBe("What is a covering index?")
            })

        it("restricts every derived kind to the requested subset",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "Indexing",
                        cards: Array.from({
                            length: 8,
                        },
                        (unused, index) => ({
                            id: `card-${index}`,
                            question: `question ${index}`,
                            level: FlashcardLevel.Middle,
                        })),
                    }],
                })

                const result = await harness.service.draw(drawParams({
                    questionCount: 10,
                    kinds: [" SCENARIO ",
                        "not-a-kind"],
                }))

                expect(result.seedTopics).toHaveLength(8)
                for (const topic of result.seedTopics) {
                    expect(topic.kind).toBe(MockInterviewKind.Scenario)
                }
            })

        it("falls back to every kind when the request names none the server knows",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "Indexing",
                        cards: Array.from({
                            length: 12,
                        },
                        (unused, index) => ({
                            id: `card-${index}`,
                            question: `question ${index}`,
                            level: FlashcardLevel.Middle,
                        })),
                    }],
                })

                const result = await harness.service.draw(drawParams({
                    questionCount: 10,
                    kinds: ["telepathy"],
                }))

                const kinds = new Set(result.seedTopics.map((topic) => topic.kind))
                expect(kinds.size).toBeGreaterThan(1)
                for (const kind of kinds) {
                    expect(Object.values(MockInterviewKind)).toContain(kind)
                }
            })

        it("treats a card with no authored level as a middle-tier card",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "Indexing",
                        cards: [
                            {
                                id: "card-unset",
                                question: "unset level",
                                level: null,
                            },
                            {
                                id: "card-junior",
                                question: "junior card",
                                level: FlashcardLevel.Junior,
                            },
                        ],
                    }],
                    ragHits: [{
                        contentId: "content-1",
                        kind: "content",
                    }],
                    contentById: {
                        "content-1": {
                            id: "content-1",
                            moduleId: "module-1",
                        },
                    },
                    modules: [{
                        id: "module-1",
                        contents: [{
                            id: "content-1",
                        }],
                    }],
                    userContents: [{
                        contentId: "content-1",
                    }],
                })

                const result = await harness.service.draw(drawParams({
                    questionCount: 3,
                }))

                // both end up drawn (the pool widens), which proves the unset card was
                // not dropped for lacking a level
                expect(result.seedTopics.map((topic) => topic.cardId).sort()).toEqual([
                    "card-junior",
                    "card-unset",
                ])
            })

        it("tolerates a deck with no cards at all",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [
                        {
                            title: "Empty deck",
                        },
                        {
                            title: "Real deck",
                            cards: [{
                                id: "card-1",
                                question: "a question",
                                level: FlashcardLevel.Middle,
                            }],
                        },
                    ],
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual(["card-1"])
            })

        it("skips the RAG lookup entirely for a deck with a blank topic",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "   ",
                        cards: [{
                            id: "card-1",
                            question: "a question",
                            level: FlashcardLevel.Middle,
                        }],
                    }],
                })

                await harness.service.draw(drawParams({
                }))

                expect(harness.contentRagRetrievalService.searchCourse).not.toHaveBeenCalled()
            })

        it("leaves a deck unscoped when retrieval returns no lesson-shaped hit",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "Indexing",
                        cards: [{
                            id: "card-1",
                            question: "a question",
                            level: FlashcardLevel.Middle,
                        }],
                    }],
                    ragHits: [{
                        contentId: "challenge-1",
                        kind: "challenge",
                    }],
                    modules: [{
                        id: "module-1",
                        contents: [{
                            id: "content-1",
                        }],
                    }],
                    userContents: [{
                        contentId: "content-1",
                    }],
                })

                const result = await harness.service.draw(drawParams({
                }))

                // no module resolved -> the card is only reachable through the widest tier
                expect(harness.entityManager.findOne).not.toHaveBeenCalled()
                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual(["card-1"])
            })

        it("leaves a deck unscoped when the best-matching lesson row is gone",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "Indexing",
                        cards: [{
                            id: "card-1",
                            question: "a question",
                            level: FlashcardLevel.Middle,
                        }],
                    }],
                    ragHits: [{
                        contentId: "content-deleted",
                        kind: "code",
                    }],
                    contentById: {
                    },
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(harness.entityManager.findOne).toHaveBeenCalledWith(
                    ContentEntity,
                    expect.objectContaining({
                        where: {
                            id: "content-deleted",
                        },
                    }),
                )
                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual(["card-1"])
            })

        it("leaves a deck unscoped when the matched lesson carries no module",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "Indexing",
                        cards: [{
                            id: "card-1",
                            question: "a question",
                            level: FlashcardLevel.Middle,
                        }],
                    }],
                    ragHits: [{
                        contentId: "content-orphan",
                        kind: "content",
                    }],
                    contentById: {
                        "content-orphan": {
                            id: "content-orphan",
                            moduleId: null,
                        },
                    },
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual(["card-1"])
            })

        it("draws no behavioral bookends for a flashcard-sourced session",
            async () => {
                const harness = makeDrawHarness({
                    technical: [],
                    decks: [{
                        title: "Indexing",
                        cards: [{
                            id: "card-1",
                            question: "a question",
                            level: FlashcardLevel.Middle,
                        }],
                    }],
                    behavioral: [{
                        ...bankRow({
                            id: "eq-1",
                            kind: "culture",
                        }),
                        family: "behavioral",
                    }],
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual(["card-1"])
                expect(harness.entityManager.find).not.toHaveBeenCalledWith(
                    MockInterviewEntity,
                    expect.objectContaining({
                        where: expect.objectContaining({
                            family: "behavioral",
                        }),
                    }),
                )
            })
    })

/**
 * A bank-sourced session is bookended like a real interview loop: a light culture
 * question opens, a deep behavioral one closes, and the two are never the same row.
 * Either bookend may be missing without breaking the session.
 */
describe("MockInterviewSessionDrawService — behavioral bookends",
    () => {
        beforeEach(() => {
            jest.spyOn(Math,
                "random").mockReturnValue(0)
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        /** Builds a behavioral bank row of the given kind and tier. */
        const eqRow = (
            id: string,
            kind: string,
            tier: string | null = "middle",
        ) => ({
            ...bankRow({
                id,
                kind,
                tier,
                prompt: `eq-prompt-${id}`,
            }),
            family: "behavioral",
        })

        it("opens with a culture question and closes with a behavioral one",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                    behavioral: [
                        eqRow("eq-culture",
                            "culture"),
                        eqRow("eq-behavioral",
                            "behavioral"),
                    ],
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual([
                    "eq-culture",
                    "q-1",
                    "eq-behavioral",
                ])
                expect(result.seedTopics[0]).toEqual({
                    cardId: "eq-culture",
                    kind: "culture",
                    title: "eq-prompt-eq-culture",
                })
            })

        it("never uses the same row for both bookends",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                    behavioral: [
                        eqRow("eq-shared",
                            "culture"),
                        eqRow("eq-closer",
                            "situational"),
                    ],
                })

                const result = await harness.service.draw(drawParams({
                }))

                const ids = result.seedTopics.map((topic) => topic.cardId)
                expect(ids[0]).toBe("eq-shared")
                expect(ids[ids.length - 1]).toBe("eq-closer")
            })

        it("still opens when only the closing kinds are unseeded",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                    behavioral: [eqRow("eq-culture",
                        "culture")],
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual([
                    "eq-culture",
                    "q-1",
                ])
            })

        it("still closes when the opening kind is unseeded",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                    behavioral: [eqRow("eq-situational",
                        "situational")],
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual([
                    "q-1",
                    "eq-situational",
                ])
            })

        it("runs the session without bookends when the behavioral bank is empty",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                    behavioral: [],
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual(["q-1"])
            })

        it("drops the closer when the only candidate row was already used as the opener",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                    // one row answering to BOTH bookend kind filters
                    behavioral: [eqRow("eq-only",
                        "culture")],
                })
                harness.entityManager.find.mockImplementation(async (
                    entity: unknown,
                    options?: { where?: Record<string, unknown> },
                ) => {
                    if (entity !== MockInterviewEntity) {
                        return []
                    }
                    if (options?.where?.family === "behavioral") {
                        return [eqRow("eq-only",
                            "culture")]
                    }
                    return [bankRow({
                        id: "q-1",
                    })]
                })

                const result = await harness.service.draw(drawParams({
                }))

                expect(result.seedTopics.map((topic) => topic.cardId)).toEqual([
                    "eq-only",
                    "q-1",
                ])
            })

        it("widens past the session tier when no behavioral row matches it",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                    behavioral: [eqRow("eq-senior",
                        "culture",
                        "senior")],
                })

                const result = await harness.service.draw(drawParams({
                    level: "junior",
                }))

                expect(result.seedTopics[0].cardId).toBe("eq-senior")
            })

        it("prefers a behavioral row at the session tier over one at another tier",
            async () => {
                const harness = makeDrawHarness({
                    technical: [bankRow({
                        id: "q-1",
                    })],
                    behavioral: [
                        eqRow("eq-senior",
                            "culture",
                            "senior"),
                        eqRow("eq-junior",
                            "culture",
                            "junior"),
                    ],
                })

                const result = await harness.service.draw(drawParams({
                    level: "junior",
                }))

                expect(result.seedTopics[0].cardId).toBe("eq-junior")
            })
    })

/**
 * How a raw request is coerced before it ever reaches a pool. None of these coercions
 * may throw: an unknown label from a newer front end must degrade to a sane default
 * rather than break the draw.
 */
describe("MockInterviewSessionDrawService — request normalization",
    () => {
        const harness = makeDrawHarness({
        })

        /** Reaches one of the service's private normalizers. */
        const normalizers = harness.service as unknown as {
            normalizeLevel: (value: string) => string
            normalizeQuestionCount: (value: number | undefined) => number
            normalizeKinds: (value: Array<string> | undefined) => ReadonlyArray<string>
            normalizeLang: (value: string | undefined) => string
            normalizeLangs: (
                langs: Array<string> | undefined,
                fallbackSingle: string | undefined,
            ) => Array<string>
        }

        it("accepts the three known levels regardless of case or padding",
            () => {
                expect(normalizers.normalizeLevel("  JUNIOR ")).toBe("junior")
                expect(normalizers.normalizeLevel("middle")).toBe("middle")
                expect(normalizers.normalizeLevel("Senior")).toBe("senior")
            })

        it("collapses an unknown level onto middle",
            () => {
                expect(normalizers.normalizeLevel("principal")).toBe("middle")
                expect(normalizers.normalizeLevel("")).toBe("middle")
            })

        it("keeps only the question counts the setup screen can request",
            () => {
                expect(normalizers.normalizeQuestionCount(3)).toBe(3)
                expect(normalizers.normalizeQuestionCount(5)).toBe(5)
                expect(normalizers.normalizeQuestionCount(10)).toBe(10)
            })

        it("falls back to five for an omitted or unrecognized question count",
            () => {
                expect(normalizers.normalizeQuestionCount(undefined)).toBe(5)
                expect(normalizers.normalizeQuestionCount(7)).toBe(5)
                expect(normalizers.normalizeQuestionCount(0)).toBe(5)
            })

        it("returns every kind for an omitted or empty kinds request",
            () => {
                expect(normalizers.normalizeKinds(undefined)).toEqual([
                    MockInterviewKind.Theory,
                    MockInterviewKind.Reasoning,
                    MockInterviewKind.Scenario,
                ])
                expect(normalizers.normalizeKinds([])).toEqual([
                    MockInterviewKind.Theory,
                    MockInterviewKind.Reasoning,
                    MockInterviewKind.Scenario,
                ])
            })

        it("dedupes a kinds request and restores the server's own fixed order",
            () => {
                expect(normalizers.normalizeKinds([
                    "SCENARIO",
                    " theory ",
                    "scenario",
                ])).toEqual([
                    MockInterviewKind.Theory,
                    MockInterviewKind.Scenario,
                ])
            })

        it("returns every kind when no requested kind is recognized",
            () => {
                expect(normalizers.normalizeKinds([
                    "telepathy",
                    "vibes",
                ])).toEqual([
                    MockInterviewKind.Theory,
                    MockInterviewKind.Reasoning,
                    MockInterviewKind.Scenario,
                ])
            })

        it("keeps the selected track languages in the server's own order",
            () => {
                expect(normalizers.normalizeLangs([
                    "GO",
                    " java ",
                    "go",
                    "brainfuck",
                ],
                undefined)).toEqual([
                    "java",
                    "go",
                ])
            })

        it("falls back to the deprecated single language when the set yields nothing",
            () => {
                expect(normalizers.normalizeLangs([],
                    "CSharp")).toEqual(["csharp"])
                expect(normalizers.normalizeLangs(undefined,
                    " go ")).toEqual(["go"])
            })

        it("falls back to all four tracks when neither field yields a known language",
            () => {
                expect(normalizers.normalizeLangs(undefined,
                    undefined)).toEqual([
                    "typescript",
                    "java",
                    "csharp",
                    "go",
                ])
                expect(normalizers.normalizeLangs(["cobol"],
                    "fortran")).toEqual([
                    "typescript",
                    "java",
                    "csharp",
                    "go",
                ])
            })

        // `normalizeLang` has no caller left in the service -- `normalizeLangs` replaced it
        // when the picker went multi-select. Kept under test because it is still exported
        // surface of the class and still states the single-language contract.
        it("coerces a single language label to a known track, defaulting to typescript",
            () => {
                expect(normalizers.normalizeLang(" JAVA ")).toBe("java")
                expect(normalizers.normalizeLang("csharp")).toBe("csharp")
                expect(normalizers.normalizeLang("cobol")).toBe("typescript")
                expect(normalizers.normalizeLang(undefined)).toBe("typescript")
            })
    })

/**
 * The pure helpers the draw is assembled from. Each states a property the draw relies
 * on: a reproducible kind assignment, a pool that stops widening the moment it is big
 * enough, and a shuffle that never repeats a candidate.
 */
describe("MockInterviewSessionDrawService — draw helpers",
    () => {
        const harness = makeDrawHarness({
        })
        const helpers = harness.service as unknown as {
            deriveSeedKind: (
                cardId: string,
                index: number,
                allowedKinds: ReadonlyArray<string>,
            ) => string
            buildQnaPool: <Type extends { id: string }>(params: {
                tiers: ReadonlyArray<Array<Type>>
                minSize: number
            }) => Array<Type>
            pickRandomMany: <Type>(pool: Array<Type>, count: number) => Array<Type>
            stripCodeFence: (code: string | null) => string | null
        }

        const allKinds = [
            MockInterviewKind.Theory,
            MockInterviewKind.Reasoning,
            MockInterviewKind.Scenario,
        ]

        it("assigns the same kind to the same card and position every time",
            () => {
                const first = helpers.deriveSeedKind("card-1",
                    0,
                    allKinds)
                const second = helpers.deriveSeedKind("card-1",
                    0,
                    allKinds)

                expect(first).toBe(second)
                expect(allKinds).toContain(first)
            })

        it("can assign the same card a different kind at a different position",
            () => {
                const kinds = new Set(
                    Array.from({
                        length: 12,
                    },
                    (unused, index) => helpers.deriveSeedKind("card-1",
                        index,
                        allKinds)),
                )

                expect(kinds.size).toBeGreaterThan(1)
            })

        it("always returns a member of the allowed subset",
            () => {
                const single = [MockInterviewKind.Reasoning]
                for (let index = 0; index < 10; index += 1) {
                    expect(helpers.deriveSeedKind(`card-${index}`,
                        index,
                        single)).toBe(MockInterviewKind.Reasoning)
                }
            })

        it("stops merging tiers as soon as the pool is big enough",
            () => {
                const pool = helpers.buildQnaPool({
                    tiers: [
                        [
                            {
                                id: "a",
                            },
                            {
                                id: "b",
                            },
                        ],
                        [{
                            id: "c",
                        }],
                    ],
                    minSize: 2,
                })

                expect(pool.map((item) => item.id)).toEqual([
                    "a",
                    "b",
                ])
            })

        it("dedupes a card that appears in more than one tier",
            () => {
                const pool = helpers.buildQnaPool({
                    tiers: [
                        [{
                            id: "a",
                        }],
                        [
                            {
                                id: "a",
                            },
                            {
                                id: "b",
                            },
                        ],
                    ],
                    minSize: 5,
                })

                expect(pool.map((item) => item.id)).toEqual([
                    "a",
                    "b",
                ])
            })

        it("returns every candidate when the pool is smaller than the requested count",
            () => {
                const drawn = helpers.pickRandomMany([
                    "a",
                    "b",
                ],
                5)

                expect([...drawn].sort()).toEqual([
                    "a",
                    "b",
                ])
            })

        it("never repeats a candidate within one draw",
            () => {
                const pool = Array.from({
                    length: 20,
                },
                (unused, index) => `card-${index}`)

                const drawn = helpers.pickRandomMany(pool,
                    8)

                expect(drawn).toHaveLength(8)
                expect(new Set(drawn).size).toBe(8)
            })

        it("leaves a null or empty given code untouched",
            () => {
                expect(helpers.stripCodeFence(null)).toBeNull()
                expect(helpers.stripCodeFence("")).toBe("")
            })

        it("strips only a fence that wraps the WHOLE value",
            () => {
                expect(helpers.stripCodeFence("```go\nfmt.Println()\n```")).toBe("fmt.Println()")
                expect(helpers.stripCodeFence("```\nplain\n```")).toBe("plain")
                // an inner fence belongs to the code and must survive
                const inner = "const doc = `\n```\nnested\n```\n`"
                expect(helpers.stripCodeFence(inner)).toBe(inner)
            })
    })
