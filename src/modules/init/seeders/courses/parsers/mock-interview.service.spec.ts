import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    Sha256Service,
} from "@modules/crypto/sha256.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    ContextLoaderService,
} from "../../shared/contexts/loader.service"
import {
    CoerceMdScalarService,
} from "../../shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService,
} from "../../shared/extracts/extract-json-from-md.service"
import {
    MergeJsonService,
} from "../../shared/merge/merge.service"
import {
    CourseIdFactoryService,
} from "../id-factories/course.service"
import {
    MockInterviewChecklistIdFactoryService,
} from "../id-factories/mock-interview-checklist.service"
import {
    MockInterviewLangIdFactoryService,
} from "../id-factories/mock-interview-lang.service"
import {
    MockInterviewIdFactoryService,
} from "../id-factories/mock-interview.service"
import {
    MockInterviewPathService,
} from "../path/mock-interview.service"
import {
    MockInterviewParserService,
} from "./mock-interview.service"

/** Mount folder of the course whose banks are parsed. */
const COURSE_RELATIVE_PATH = "0-fullstack-mastery"
/** Mount folder of the single bank under test. */
const BANK_RELATIVE_PATH = `${COURSE_RELATIVE_PATH}/mock-interview/0-core-concepts`
/** Mount folder of the single question under test. */
const QUESTION_RELATIVE_PATH = `${BANK_RELATIVE_PATH}/questions/0-event-loop`
/** Mount folder of the single per-language body under test. */
const BODY_RELATIVE_PATH = `${QUESTION_RELATIVE_PATH}/bodies/0-typescript`

/** Owning course id every parse call is given. */
const COURSE_ID = "0f5f3d18-4a0e-4d2c-9f57-8f1f3a2b1c00"

describe("MockInterviewParserService",
    () => {
        let testingModule: TestingModule
        let service: MockInterviewParserService
        let entityManager: EntityManagerMock
        let winstonService: {
            log: jest.Mock
        }
        let pathService: {
            paths: jest.Mock
            questionPaths: jest.Mock
            bodyPaths: jest.Mock
        }
        let mergeJsonService: {
            merge: jest.Mock
        }
        /** Fake mount: relative path -> markdown body. */
        let mount: Map<string, string>

        /**
         * Register the same markdown for both locale files of a folder.
         *
         * @param folder - Folder path under the `courses` context root
         * @param markdown - Raw mount markdown body
         */
        const mountFolder = (
            folder: string,
            markdown: string,
        ): void => {
            mount.set(`${folder}/${Locale.En}.md`,
                markdown)
            mount.set(`${folder}/${Locale.Vi}.md`,
                markdown)
        }

        /** The single bank path the path service resolves by default. */
        const bankPath = {
            relativePath: BANK_RELATIVE_PATH,
            orderIndex: 0,
            displayId: "core-concepts",
        }
        /** The single question path the path service resolves by default. */
        const questionPath = {
            relativePath: QUESTION_RELATIVE_PATH,
            orderIndex: 0,
            displayId: "event-loop",
        }
        /** The single body path used by the `bodies/` tests. */
        const bodyPath = {
            relativePath: BODY_RELATIVE_PATH,
            orderIndex: 0,
            displayId: "typescript",
        }

        /**
         * Parse the mounted bank list for the course under test.
         *
         * @returns Question rows the parser produced
         */
        const parseMany = async () => service.parseMany({
            courseRelativePath: COURSE_RELATIVE_PATH,
            courseIndex: 0,
            courseId: COURSE_ID,
        })

        beforeEach(async () => {
            mount = new Map()
            entityManager = makeEntityManagerMock()
            winstonService = {
                log: jest.fn(),
            }
            pathService = {
                paths: jest.fn().mockResolvedValue([
                    bankPath,
                ]),
                questionPaths: jest.fn().mockResolvedValue([
                    questionPath,
                ]),
                bodyPaths: jest.fn().mockResolvedValue([]),
            }
            const realMergeJsonService = new MergeJsonService()
            mergeJsonService = {
                merge: jest.fn(
                    (params: Parameters<MergeJsonService["merge"]>[0]) =>
                        realMergeJsonService.merge(params),
                ),
            }

            testingModule = await Test.createTestingModule({
                providers: [
                    MockInterviewParserService,
                    ExtractJsonFromMdService,
                    CoerceMdScalarService,
                    Sha256Service,
                    CourseIdFactoryService,
                    MockInterviewIdFactoryService,
                    MockInterviewLangIdFactoryService,
                    MockInterviewChecklistIdFactoryService,
                    {
                        provide: MergeJsonService,
                        useValue: mergeJsonService,
                    },
                    {
                        provide: MockInterviewPathService,
                        useValue: pathService,
                    },
                    {
                        provide: ContextLoaderService,
                        useValue: {
                            load: jest.fn(
                                async (
                                    _baseDir: string,
                                    relativePath: string,
                                ): Promise<string> => {
                                    const body = mount.get(relativePath)
                                    if (body === undefined) {
                                        throw new Error(`missing mount file: ${relativePath}`)
                                    }
                                    return body
                                },
                            ),
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonService,
                    },
                    {
                        provide: getEntityManagerToken("primary"),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = testingModule.get<MockInterviewParserService>(
                MockInterviewParserService,
            )
        })

        afterEach(async () => {
            await testingModule.close()
        })

        describe("parseMany",
            () => {
                it("returns nothing when the course has no bank folders",
                    async () => {
                        pathService.paths.mockResolvedValue([])

                        await expect(parseMany()).resolves.toEqual([])
                        expect(pathService.questionPaths).not.toHaveBeenCalled()
                    })

                it("skips a bank whose meta files are unreadable and logs the skip",
                    async () => {
                        // nothing mounted -> the loader rejects while reading the bank meta
                        await expect(parseMany()).resolves.toEqual([])
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitSeederEntitySkipped,
                            expect.objectContaining({
                                relativePath: BANK_RELATIVE_PATH,
                            }),
                        )
                    })

                it("flattens every bank's questions into one list",
                    async () => {
                        const secondBankPath = {
                            relativePath: `${COURSE_RELATIVE_PATH}/mock-interview/1-systems`,
                            orderIndex: 1,
                            displayId: "systems",
                        }
                        const secondQuestionPath = {
                            relativePath: `${secondBankPath.relativePath}/questions/0-sharding`,
                            orderIndex: 0,
                            displayId: "sharding",
                        }
                        pathService.paths.mockResolvedValue([
                            bankPath,
                            secondBankPath,
                        ])
                        pathService.questionPaths.mockImplementation(
                            async (bankRelativePath: string) =>
                                bankRelativePath === BANK_RELATIVE_PATH
                                    ? [
                                        questionPath,
                                    ]
                                    : [
                                        secondQuestionPath,
                                    ],
                        )
                        mountFolder(BANK_RELATIVE_PATH,
                            "# title\nCore")
                        mountFolder(secondBankPath.relativePath,
                            "# title\nSystems")
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nExplain the event loop")
                        mountFolder(secondQuestionPath.relativePath,
                            "# prompt\nExplain sharding")

                        const rows = await parseMany()

                        expect(rows).toHaveLength(2)
                        expect(rows.map((row) => row.relativePath)).toEqual([
                            QUESTION_RELATIVE_PATH,
                            secondQuestionPath.relativePath,
                        ])
                        expect(rows[0].data.bankSlug).toBe("core-concepts")
                        expect(rows[1].data.bankSlug).toBe("systems")
                    })
            })

        describe("question mapping",
            () => {
                beforeEach(() => {
                    mountFolder(BANK_RELATIVE_PATH,
                        "# title\nCore")
                })

                it("maps every authored field onto the question row",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            [
                                "# family",
                                "behavioral",
                                "# kind",
                                "conflict",
                                "# tier",
                                "senior",
                                "# prompt",
                                "Tell me about a conflict",
                                "# idealAnswer",
                                "Own the outcome",
                                "# diagram",
                                "graph TD",
                                "# givenCode",
                                "const a = 1",
                                "# givenLang",
                                "typescript",
                                "# competency",
                                "ownership",
                                "# ownershipSignal",
                                "Uses I not we",
                                "# isPremium",
                                "true",
                                "# sortIndex",
                                "4",
                            ].join("\n"))

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.index).toBe(0)
                        expect(row.data.family).toBe("behavioral")
                        expect(row.data.kind).toBe("conflict")
                        expect(row.data.tier).toBe("senior")
                        expect(row.data.prompt).toBe("Tell me about a conflict")
                        expect(row.data.idealAnswer).toBe("Own the outcome")
                        expect(row.data.diagram).toBe("graph TD")
                        expect(row.data.givenCode).toBe("const a = 1")
                        expect(row.data.givenLang).toBe("typescript")
                        expect(row.data.competency).toBe("ownership")
                        expect(row.data.ownershipSignal).toBe("Uses I not we")
                        expect(row.data.isPremium).toBe(true)
                        expect(row.data.sortIndex).toBe(4)
                        expect(row.data.courseId).toBe(COURSE_ID)
                        expect(row.data.displayId).toBe("event-loop")
                        expect(row.data.defaultLocale).toBe(Locale.En)
                    })

                it("applies the documented defaults for an otherwise empty question",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# kind\n")

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.family).toBe("technical")
                        expect(row.data.kind).toBe("")
                        expect(row.data.prompt).toBe("")
                        expect(row.data.tier).toBeNull()
                        expect(row.data.idealAnswer).toBeNull()
                        expect(row.data.rubric).toBeNull()
                        expect(row.data.followUps).toBeNull()
                        expect(row.data.hints).toBeNull()
                        expect(row.data.keywords).toBeNull()
                        expect(row.data.tags).toBeNull()
                        expect(row.data.checklists).toEqual([])
                        expect(row.data.langs).toEqual([])
                        expect(row.data.isPremium).toBe(false)
                        expect(row.data.moduleId).toBeNull()
                        // no `# sortIndex` -> the question folder ordinal
                        expect(row.data.sortIndex).toBe(0)
                    })

                it("keeps a Vietnamese prompt translation aligned to the question id",
                    async () => {
                        mount.set(`${QUESTION_RELATIVE_PATH}/${Locale.En}.md`,
                            "# prompt\nExplain the event loop")
                        mount.set(`${QUESTION_RELATIVE_PATH}/${Locale.Vi}.md`,
                            "# prompt\nGiai thich event loop")

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    mockInterviewId: row.data.id,
                                    locale: Locale.Vi,
                                    field: "prompt",
                                    value: "Giai thich event loop",
                                }),
                            ]),
                        )
                    })

                it("keeps only non-empty trimmed entries in the scalar lists",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            [
                                "# rubric",
                                "## 0",
                                "  Mentions the task queue  ",
                                "## 1",
                                "   ",
                                "## 2",
                                "### note",
                                "an item authored with no value leaf",
                                "# tags",
                                "## 0",
                                "async",
                            ].join("\n"))

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.rubric).toEqual([
                            "Mentions the task queue",
                        ])
                        expect(row.data.tags).toEqual([
                            "async",
                        ])
                    })

                it("skips a question whose files are unreadable and keeps going",
                    async () => {
                        const brokenQuestionPath = {
                            relativePath: `${BANK_RELATIVE_PATH}/questions/1-broken`,
                            orderIndex: 1,
                            displayId: "broken",
                        }
                        pathService.questionPaths.mockResolvedValue([
                            questionPath,
                            brokenQuestionPath,
                        ])
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nExplain the event loop")

                        const rows = await parseMany()

                        expect(rows).toHaveLength(1)
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitSeederEntitySkipped,
                            expect.objectContaining({
                                relativePath: brokenQuestionPath.relativePath,
                            }),
                        )
                    })

                it("falls back to the question ordinal when sortIndex is not finite",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nX")
                        mergeJsonService.merge.mockReturnValue({
                            prompt: "X",
                            sortIndex: Number.NaN,
                        })
                        pathService.questionPaths.mockResolvedValue([
                            {
                                ...questionPath,
                                orderIndex: 6,
                            },
                        ])

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.sortIndex).toBe(6)
                    })
            })

        describe("checklists",
            () => {
                beforeEach(() => {
                    mountFolder(BANK_RELATIVE_PATH,
                        "# title\nCore")
                })

                it("builds one checkpoint row per `# checklist` item",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            [
                                "# checklist",
                                "## 0",
                                "### text",
                                "Names the microtask queue",
                                "### dimension",
                                "technical",
                                "### critical",
                                "true",
                                "### scoreBand",
                                "40",
                                "## 1",
                                "### text",
                                "Mentions starvation",
                            ].join("\n"))

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.checklists).toHaveLength(2)
                        const [
                            first,
                            second,
                        ] = row.data.checklists ?? []
                        expect(first.text).toBe("Names the microtask queue")
                        expect(first.dimension).toBe("technical")
                        expect(first.critical).toBe(true)
                        expect(first.scoreBand).toBe(40)
                        expect(first.orderIndex).toBe(0)
                        expect(first.mockInterview).toEqual({
                            id: row.data.id,
                        })
                        // unauthored checkpoint fields fall back rather than throwing
                        expect(second.dimension).toBeNull()
                        expect(second.critical).toBe(false)
                        expect(second.scoreBand).toBe(0)
                        expect(second.orderIndex).toBe(1)
                    })

                it("returns no checkpoint rows when `# checklist` is an empty list",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nX")
                        mergeJsonService.merge.mockReturnValue({
                            prompt: "X",
                            checklist: [],
                        })

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.checklists).toEqual([])
                    })
            })

        describe("inline `# langs`",
            () => {
                beforeEach(() => {
                    mountFolder(BANK_RELATIVE_PATH,
                        "# title\nCore")
                })

                it("builds one language row per inline lang item",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            [
                                "# langs",
                                "## 0",
                                "### lang",
                                "typescript",
                                "### givenCode",
                                "const a = 1",
                            ].join("\n"))

                        const [
                            row,
                        ] = await parseMany()

                        const [
                            lang,
                        ] = row.data.langs ?? []
                        expect(lang.lang).toBe("typescript")
                        expect(lang.givenCode).toBe("const a = 1")
                        expect(lang.orderIndex).toBe(0)
                        expect(lang.sortIndex).toBe(0)
                        expect(lang.defaultLocale).toBe(Locale.En)
                        expect(lang.mockInterview).toEqual({
                            id: row.data.id,
                        })
                    })

                it("defaults a lang row's text fields and translations when unauthored",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nX")
                        mergeJsonService.merge.mockReturnValue({
                            prompt: "X",
                            langs: [
                                {
                                },
                            ],
                        })

                        const [
                            row,
                        ] = await parseMany()

                        const [
                            lang,
                        ] = row.data.langs ?? []
                        expect(lang.lang).toBe("")
                        expect(lang.givenCode).toBe("")
                        expect(lang.translations).toEqual([])
                    })

                it("returns no lang rows when `# langs` is an empty list",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nX")
                        mergeJsonService.merge.mockReturnValue({
                            prompt: "X",
                            langs: [],
                        })

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.langs).toEqual([])
                    })
            })

        describe("per-language `bodies/`",
            () => {
                beforeEach(() => {
                    mountFolder(BANK_RELATIVE_PATH,
                        "# title\nCore")
                    pathService.bodyPaths.mockResolvedValue([
                        bodyPath,
                    ])
                })

                it("prefers body rows over the inline `# langs` fallback",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            [
                                "# langs",
                                "## 0",
                                "### lang",
                                "java",
                                "### givenCode",
                                "class A {}",
                            ].join("\n"))
                        mountFolder(BODY_RELATIVE_PATH,
                            [
                                "# lang",
                                "typescript",
                                "# givenCode",
                                "const a = 1",
                                "# prompt",
                                "Fix the leak",
                                "# idealAnswer",
                                "Unsubscribe",
                            ].join("\n"))

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.langs).toHaveLength(1)
                        const [
                            lang,
                        ] = row.data.langs ?? []
                        expect(lang.lang).toBe("typescript")
                        expect(lang.givenCode).toBe("const a = 1")
                        expect(lang.prompt).toBe("Fix the leak")
                        expect(lang.idealAnswer).toBe("Unsubscribe")
                        expect(lang.orderIndex).toBe(0)
                        expect(lang.mockInterview).toEqual({
                            id: row.data.id,
                        })
                    })

                it("falls back to the folder slug when the body has no `# lang`",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nX")
                        mountFolder(BODY_RELATIVE_PATH,
                            "# givenCode\nconst a = 1")

                        const [
                            row,
                        ] = await parseMany()

                        const [
                            lang,
                        ] = row.data.langs ?? []
                        expect(lang.lang).toBe("typescript")
                        expect(lang.prompt).toBeNull()
                        expect(lang.idealAnswer).toBeNull()
                    })

                it("defaults givenCode to empty and translations to none",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nX")
                        mountFolder(BODY_RELATIVE_PATH,
                            "# lang\ntypescript")
                        mergeJsonService.merge.mockImplementation(
                            (params: Parameters<MergeJsonService["merge"]>[0]) =>
                                params.translateFields.includes("givenCode")
                                    ? {
                                        lang: "typescript",
                                    }
                                    : {
                                        prompt: "X",
                                    },
                        )

                        const [
                            row,
                        ] = await parseMany()

                        const [
                            lang,
                        ] = row.data.langs ?? []
                        expect(lang.givenCode).toBe("")
                        expect(lang.translations).toEqual([])
                    })

                it("carries the Vietnamese body translation on the lang row",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nX")
                        mount.set(`${BODY_RELATIVE_PATH}/${Locale.En}.md`,
                            "# lang\ntypescript\n# prompt\nFix the leak")
                        mount.set(`${BODY_RELATIVE_PATH}/${Locale.Vi}.md`,
                            "# lang\ntypescript\n# prompt\nSua ro ri")

                        const [
                            row,
                        ] = await parseMany()

                        const [
                            lang,
                        ] = row.data.langs ?? []
                        expect(lang.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    mockInterviewLangId: lang.id,
                                    locale: Locale.Vi,
                                    field: "prompt",
                                    value: "Sua ro ri",
                                }),
                            ]),
                        )
                    })

                it("skips an unreadable body folder and logs it",
                    async () => {
                        mountFolder(QUESTION_RELATIVE_PATH,
                            "# prompt\nX")
                        // the body markdown is never mounted -> the loader rejects

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.langs).toEqual([])
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitSeederEntitySkipped,
                            expect.objectContaining({
                                relativePath: BODY_RELATIVE_PATH,
                            }),
                        )
                    })
            })

        describe("moduleRefs resolution",
            () => {
                beforeEach(() => {
                    mountFolder(QUESTION_RELATIVE_PATH,
                        "# prompt\nX")
                })

                it("leaves moduleId null when the bank has no `# moduleRefs`",
                    async () => {
                        mountFolder(BANK_RELATIVE_PATH,
                            "# title\nCore")

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.moduleId).toBeNull()
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                    })

                it("resolves the first matching module within the owning course",
                    async () => {
                        mountFolder(BANK_RELATIVE_PATH,
                            [
                                "# moduleRefs",
                                "## 0",
                                "  nestjs-core  ",
                                "## 1",
                                "   ",
                                "## 2",
                                "### note",
                                "a ref authored with no value leaf",
                            ].join("\n"))
                        entityManager.findOne.mockResolvedValue({
                            id: "module-1",
                        })

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.moduleId).toBe("module-1")
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            ModuleEntity,
                            expect.objectContaining({
                                where: {
                                    displayId: "nestjs-core",
                                    course: {
                                        id: COURSE_ID,
                                    },
                                },
                            }),
                        )
                    })

                it("tries every distinct ref and yields null when none resolve",
                    async () => {
                        mountFolder(BANK_RELATIVE_PATH,
                            [
                                "# moduleRefs",
                                "## 0",
                                "nestjs-core",
                                "## 1",
                                "nestjs-core",
                                "## 2",
                                "graphql-layer",
                            ].join("\n"))
                        entityManager.findOne.mockResolvedValue(null)

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.moduleId).toBeNull()
                        // duplicates are de-duplicated before the lookup loop
                        expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                    })

                it("skips the earlier unresolved ref and keeps the later match",
                    async () => {
                        mountFolder(BANK_RELATIVE_PATH,
                            [
                                "# moduleRefs",
                                "## 0",
                                "missing-module",
                                "## 1",
                                "graphql-layer",
                            ].join("\n"))
                        entityManager.findOne
                            .mockResolvedValueOnce(null)
                            .mockResolvedValueOnce({
                                id: "module-2",
                            })

                        const [
                            row,
                        ] = await parseMany()

                        expect(row.data.moduleId).toBe("module-2")
                    })
            })

        it("returns null for an absent scalar list and removes blank list values",
            () => {
                const toStringArray = (service as unknown as {
                    toStringArray: (items: Array<{ value?: string }> | undefined) => Array<string> | null
                }).toStringArray.bind(service)

                expect(toStringArray(undefined)).toBeNull()
                expect(toStringArray([])).toBeNull()
                expect(toStringArray([
                    {
                        value: " first "
                    },
                    {
                        value: " "
                    },
                    {
                        value: undefined
                    },
                    {
                        value: "second"
                    },
                ])).toEqual(["first",
                    "second"])
            })
    })
