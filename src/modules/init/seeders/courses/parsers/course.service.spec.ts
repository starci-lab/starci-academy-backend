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
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    Sha256Service,
} from "@modules/crypto/sha256.service"
import {
    CoursePathNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-path-not-found"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3BuildService,
} from "@modules/integrations/s3/s3-build.service"
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
    LivestreamSessionIdFactoryService,
} from "../id-factories/livestream-session.service"
import {
    PrerequisiteIdFactoryService,
} from "../id-factories/prerequisite.service"
import {
    PricingPhaseIdFactoryService,
} from "../id-factories/pricing-phase.service"
import {
    QnaIdFactoryService,
} from "../id-factories/qna.service"
import {
    ValuePropositionIdFactoryService,
} from "../id-factories/value-proposition.service"
import {
    CoursePathService,
} from "../path/course.service"
import {
    CourseParserService,
} from "./course.service"

/** Mount folder of the course under test. */
const COURSE_RELATIVE_PATH = "0-fullstack-mastery"

/** The argument the parser hands to the stubbed public-URL builder. */
interface BuildPublicObjectUrlArgs {
    /** MinIO object key the cover value resolved to. */
    key: string
}

describe("CourseParserService",
    () => {
        let testingModule: TestingModule
        let service: CourseParserService
        let entityManager: EntityManagerMock
        let winstonService: {
            log: jest.Mock
        }
        let coursePathService: {
            paths: jest.Mock
        }
        let buildPublicObjectUrl: jest.Mock
        /**
         * Delegates to the real merge by default; individual tests override it to
         * hand the parser a merged tree the markdown grammar cannot express (rows
         * with no `orderIndex` / no `translations`), which is what the parser's
         * `?? []` / `?? 0` fallbacks exist for.
         */
        let mergeJsonService: {
            merge: jest.Mock
        }

        /** Fake mount: relative path -> markdown body. */
        let mount: Map<string, string>

        /**
         * Register one markdown file on the fake mount.
         *
         * @param relativePath - Path under the `courses` context root
         * @param markdown - Raw mount markdown body
         */
        const mountFile = (
            relativePath: string,
            markdown: string,
        ): void => {
            mount.set(relativePath,
                markdown)
        }

        /** The single resolved course path every test parses. */
        const coursePath = {
            relativePath: COURSE_RELATIVE_PATH,
            orderIndex: 0,
            displayId: "fullstack-mastery",
        }

        beforeEach(async () => {
            mount = new Map()
            entityManager = makeEntityManagerMock()
            winstonService = {
                log: jest.fn(),
            }
            coursePathService = {
                paths: jest.fn().mockResolvedValue([
                    coursePath,
                ]),
            }
            buildPublicObjectUrl = jest.fn(
                (params: BuildPublicObjectUrlArgs) =>
                    `https://minio.test/public/${params.key}`,
            )
            const realMergeJsonService = new MergeJsonService()
            mergeJsonService = {
                merge: jest.fn(
                    (params: Parameters<MergeJsonService["merge"]>[0]) =>
                        realMergeJsonService.merge(params),
                ),
            }

            testingModule = await Test.createTestingModule({
                providers: [
                    CourseParserService,
                    // the shared markdown grammar + merge are the real thing: the parser's
                    // contract is defined in terms of what they produce
                    ExtractJsonFromMdService,
                    CoerceMdScalarService,
                    Sha256Service,
                    CourseIdFactoryService,
                    PrerequisiteIdFactoryService,
                    QnaIdFactoryService,
                    ValuePropositionIdFactoryService,
                    PricingPhaseIdFactoryService,
                    LivestreamSessionIdFactoryService,
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
                        provide: MergeJsonService,
                        useValue: mergeJsonService,
                    },
                    {
                        provide: CoursePathService,
                        useValue: coursePathService,
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonService,
                    },
                    {
                        provide: S3BuildService,
                        useValue: {
                            buildPublicObjectUrl,
                        },
                    },
                    {
                        provide: getEntityManagerToken("primary"),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = testingModule.get<CourseParserService>(CourseParserService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        describe("parse",
            () => {
                it("throws CoursePathNotFoundException when no path matches the ordinal",
                    async () => {
                        await expect(service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 9,
                        })).rejects.toBeInstanceOf(CoursePathNotFoundException)
                    })

                it("maps title/description with a Vietnamese translation row",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            [
                                "# title",
                                "Fullstack Mastery",
                                "# description",
                                "Ship production systems.",
                            ].join("\n"))
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            [
                                "# title",
                                "Thanh thao fullstack",
                                "# description",
                                "Xay he thong that.",
                            ].join("\n"))

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        expect(parsed.title).toBe("Fullstack Mastery")
                        expect(parsed.description).toBe("Ship production systems.")
                        expect(parsed.displayId).toBe("fullstack-mastery")
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.orderIndex).toBe(0)
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Thanh thao fullstack",
                                }),
                            ]),
                        )
                    })

                it("falls back to empty title/description and zero price when unauthored",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# displayOnly\nnothing")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# displayOnly\nnothing")

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        expect(parsed.title).toBe("")
                        expect(parsed.description).toBe("")
                        expect(parsed.originalPrice).toBe(0)
                        expect(parsed.mindMap).toBeNull()
                        expect(parsed.coverImageUrl).toBeUndefined()
                        expect(parsed.playgroundPreviewImageUrl).toBeUndefined()
                        expect(parsed.prerequisites).toEqual([])
                        expect(parsed.valuePropositions).toEqual([])
                        expect(parsed.qnas).toEqual([])
                        expect(parsed.pricingPhases).toEqual([])
                        expect(parsed.livestreamSessions).toEqual([])
                    })

                it("uses `# sortIndex` when authored and the ordinal when it is not a number",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# sortIndex\n 42 ")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# sortIndex\n 42 ")

                        const withSortIndex = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })
                        expect(withSortIndex.sortIndex).toBe(42)

                        mount.clear()
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# sortIndex\nlast")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# sortIndex\nlast")

                        const withoutSortIndex = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })
                        expect(withoutSortIndex.sortIndex).toBe(0)
                    })

                it("accepts a non-string sortIndex and rejects a non-finite one",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# title\nFullstack")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# title\nFullstack")
                        mergeJsonService.merge.mockReturnValue({
                            title: "Fullstack",
                            sortIndex: 7,
                        })

                        const numeric = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })
                        expect(numeric.sortIndex).toBe(7)

                        mergeJsonService.merge.mockReturnValue({
                            title: "Fullstack",
                            sortIndex: Number.NaN,
                        })
                        const invalid = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })
                        expect(invalid.sortIndex).toBe(0)
                        const toSortIndex = (service as unknown as {
                            toSortIndex: (value: unknown, fallback: number) => number
                        }).toSortIndex.bind(service)
                        expect(toSortIndex(" 11 ",
                            3)).toBe(11)
                        expect(toSortIndex(Number.POSITIVE_INFINITY,
                            3)).toBe(3)
                    })

                it("reads the authored mind-map when `mind-map.json` is present",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# title\nFullstack")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# title\nFullstack")
                        mountFile(`${COURSE_RELATIVE_PATH}/mind-map.json`,
                            JSON.stringify({
                                label: "root",
                                children: [],
                            }))

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        expect(parsed.mindMap).toEqual({
                            label: "root",
                            children: [],
                        })
                    })

                it("keeps the mind-map null when `mind-map.json` holds invalid JSON",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# title\nFullstack")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# title\nFullstack")
                        mountFile(`${COURSE_RELATIVE_PATH}/mind-map.json`,
                            "{ not json")

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        expect(parsed.mindMap).toBeNull()
                    })

                it("keeps the mind-map null when `mind-map.json` is empty",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# title\nFullstack")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# title\nFullstack")
                        mountFile(`${COURSE_RELATIVE_PATH}/mind-map.json`,
                            "")

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        expect(parsed.mindMap).toBeNull()
                    })
            })

        describe("coverImageUrl",
            () => {
                /**
                 * Parse a course whose only authored field is `# coverImageUrl`.
                 *
                 * @param value - Raw cover value written into both locale files
                 * @returns The resolved cover URL the parser persisted, as the parsed
                 *   `DeepPartial<CourseEntity>` carries it (the column is nullable)
                 */
                const parseCover = async (value: string): Promise<string | null | undefined> => {
                    mount.clear()
                    const markdown = `# coverImageUrl\n${value}`
                    mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                        markdown)
                    mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                        markdown)
                    const parsed = await service.parse({
                        paths: [
                            coursePath,
                        ],
                        courseIndex: 0,
                    })
                    return parsed.coverImageUrl
                }

                it("keeps an absolute http(s) cover verbatim without touching S3",
                    async () => {
                        await expect(parseCover("https://cdn.example.com/a.png"))
                            .resolves.toBe("https://cdn.example.com/a.png")
                        expect(buildPublicObjectUrl).not.toHaveBeenCalled()
                    })

                it("expands a MinIO object key into a public URL",
                    async () => {
                        await expect(parseCover("assets/courses/fullstack.png"))
                            .resolves.toBe("https://minio.test/public/assets/courses/fullstack.png")
                        expect(buildPublicObjectUrl).toHaveBeenCalledWith({
                            key: "assets/courses/fullstack.png",
                            provider: S3Provider.Minio,
                        })
                    })

                it("strips leading slashes before expanding the object key",
                    async () => {
                        await parseCover("///assets/courses/fullstack.png")

                        expect(buildPublicObjectUrl).toHaveBeenCalledWith({
                            key: "assets/courses/fullstack.png",
                            provider: S3Provider.Minio,
                        })
                    })

                it("returns undefined for a blank cover value",
                    async () => {
                        await expect(parseCover("   ")).resolves.toBeUndefined()
                        expect(buildPublicObjectUrl).not.toHaveBeenCalled()
                    })
            })

        describe("playgroundPreviewImageUrl",
            () => {
                it("persists a mounted Playground preview as a public MinIO URL",
                    async () => {
                        mount.clear()
                        const markdown = [
                            "# playgroundPreviewImageUrl",
                            "assets/playgrounds/devops-playground-overview.png",
                        ].join("\n")
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            markdown)
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            markdown)

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        expect(parsed.playgroundPreviewImageUrl)
                            .toBe("https://minio.test/public/assets/playgrounds/devops-playground-overview.png")
                        expect(buildPublicObjectUrl).toHaveBeenCalledWith({
                            key: "assets/playgrounds/devops-playground-overview.png",
                            provider: S3Provider.Minio,
                        })
                    })
            })

        describe("nested collections",
            () => {
                it("builds prerequisites with deterministic ids and aligned translations",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            [
                                "# prerequisites",
                                "## 0",
                                "### text",
                                "Know JavaScript",
                                "## 1",
                                "### text",
                                "Know SQL",
                            ].join("\n"))
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            [
                                "# prerequisites",
                                "## 0",
                                "### text",
                                "Biet JavaScript",
                                "## 1",
                                "### text",
                                "Biet SQL",
                            ].join("\n"))

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        expect(parsed.prerequisites).toHaveLength(2)
                        const [
                            first,
                        ] = parsed.prerequisites ?? []
                        expect(first.text).toBe("Know JavaScript")
                        expect(first.orderIndex).toBe(0)
                        expect(first.defaultLocale).toBe(Locale.En)
                        expect(first.course).toEqual({
                            id: parsed.id,
                        })
                        expect(first.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    prerequisiteId: first.id,
                                    locale: Locale.Vi,
                                    field: "text",
                                    value: "Biet JavaScript",
                                },
                            ]),
                        )
                    })

                it("builds value propositions carrying their own id on each translation",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            [
                                "# valuePropositions",
                                "## 0",
                                "### text",
                                "Real projects",
                            ].join("\n"))
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            [
                                "# valuePropositions",
                                "## 0",
                                "### text",
                                "Du an that",
                            ].join("\n"))

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        const [
                            proposition,
                        ] = parsed.valuePropositions ?? []
                        expect(proposition.text).toBe("Real projects")
                        expect(proposition.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    valuePropositionId: proposition.id,
                                    locale: Locale.Vi,
                                    field: "text",
                                    value: "Du an that",
                                },
                            ]),
                        )
                    })

                it("builds qnas with both question and answer translations",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            [
                                "# qnas",
                                "## 0",
                                "### question",
                                "Is it hard?",
                                "### answer",
                                "No.",
                            ].join("\n"))
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            [
                                "# qnas",
                                "## 0",
                                "### question",
                                "Co kho khong?",
                                "### answer",
                                "Khong.",
                            ].join("\n"))

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        const [
                            qna,
                        ] = parsed.qnas ?? []
                        expect(qna.question).toBe("Is it hard?")
                        expect(qna.answer).toBe("No.")
                        expect(qna.course).toEqual({
                            id: parsed.id,
                        })
                        expect(qna.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    qnaId: qna.id,
                                    field: "question",
                                    value: "Co kho khong?",
                                }),
                                expect.objectContaining({
                                    qnaId: qna.id,
                                    field: "answer",
                                    value: "Khong.",
                                }),
                            ]),
                        )
                    })

                it("coerces pricing-phase price and slot to null when authored as `null`",
                    async () => {
                        const markdown = [
                            "# pricingPhases",
                            "## 0",
                            "### phase",
                            "earlyBird",
                            "### price",
                            "1990000",
                            "### slotAvailable",
                            "null",
                        ].join("\n")
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            markdown)
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            markdown)

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        const [
                            phase,
                        ] = parsed.pricingPhases ?? []
                        expect(phase.phase).toBe(PricingPhase.EarlyBird)
                        expect(phase.orderIndex).toBe(0)
                        expect(phase.price).toBe(1990000)
                        expect(phase.slotAvailable).toBeNull()
                        expect(typeof phase.id).toBe("string")
                    })

                it("maps livestream sessions onto the owning course id",
                    async () => {
                        const markdown = [
                            "# livestreamSessions",
                            "## 0",
                            "### dayOfWeek",
                            "monday",
                            "### startTime",
                            "19:00",
                            "### expectedEndTime",
                            "21:00",
                            "### isOverridable",
                            "true",
                        ].join("\n")
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            markdown)
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            markdown)

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        const [
                            session,
                        ] = parsed.livestreamSessions ?? []
                        expect(session.course).toEqual({
                            id: parsed.id,
                        })
                        expect(session.dayOfWeek).toBe("monday")
                        expect(session.startTime).toBe("19:00")
                        expect(session.expectedEndTime).toBe("21:00")
                        expect(session.orderIndex).toBe(0)
                        expect(session.translations).toEqual([])
                    })

                it("reads originalPrice off the merged mount value",
                    async () => {
                        const markdown = "# originalPrice\n2990000"
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            markdown)
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            markdown)

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        expect(parsed.originalPrice).toBe(2990000)
                    })
            })

        describe("merged rows missing orderIndex / translations",
            () => {
                it("defaults every ordinal to 0 and every translation list to empty",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# title\nFullstack")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# title\nFullstack")
                        // a merged tree with no orderIndex and no translations anywhere --
                        // the shape the parser's `?? 0` / `?? []` fallbacks guard against
                        mergeJsonService.merge.mockReturnValue({
                            title: "Fullstack",
                            prerequisites: [
                                {
                                    text: "Know JavaScript",
                                },
                            ],
                            valuePropositions: [
                                {
                                    text: "Real projects",
                                },
                            ],
                            qnas: [
                                {
                                    question: "Is it hard?",
                                    answer: "No.",
                                },
                            ],
                            pricingPhases: [
                                {
                                    phase: "earlyBird",
                                },
                            ],
                            livestreamSessions: [
                                {
                                    dayOfWeek: "monday",
                                },
                            ],
                        })

                        const parsed = await service.parse({
                            paths: [
                                coursePath,
                            ],
                            courseIndex: 0,
                        })

                        expect(parsed.prerequisites?.[0].translations).toEqual([])
                        expect(parsed.prerequisites?.[0].orderIndex).toBeUndefined()
                        expect(parsed.valuePropositions?.[0].translations).toEqual([])
                        expect(parsed.qnas?.[0].translations).toEqual([])
                        expect(parsed.livestreamSessions?.[0].orderIndex).toBeUndefined()
                        expect(parsed.pricingPhases?.[0].orderIndex).toBeUndefined()
                        expect(parsed.translations).toEqual([])
                        // ids still resolve -- the missing ordinals fall back to 0
                        expect(typeof parsed.prerequisites?.[0].id).toBe("string")
                        expect(typeof parsed.pricingPhases?.[0].id).toBe("string")
                        expect(typeof parsed.livestreamSessions?.[0].id).toBe("string")
                    })
            })

        describe("parseMany",
            () => {
                it("returns one result per resolved course path",
                    async () => {
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# title\nFullstack Mastery")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# title\nThanh thao fullstack")

                        const results = await service.parseMany()

                        expect(results).toHaveLength(1)
                        expect(results[0].index).toBe(0)
                        expect(results[0].relativePath).toBe(COURSE_RELATIVE_PATH)
                        expect(results[0].data.title).toBe("Fullstack Mastery")
                        expect(winstonService.log).not.toHaveBeenCalled()
                    })

                it("skips a course whose mount files cannot be read and logs it",
                    async () => {
                        // nothing mounted -> the loader rejects and parse() throws
                        const results = await service.parseMany()

                        expect(results).toEqual([])
                        expect(winstonService.log).toHaveBeenCalledTimes(1)
                    })

                it("keeps the readable courses when one of them fails",
                    async () => {
                        const brokenPath = {
                            relativePath: "1-system-design-mastery",
                            orderIndex: 1,
                            displayId: "system-design-mastery",
                        }
                        coursePathService.paths.mockResolvedValue([
                            coursePath,
                            brokenPath,
                        ])
                        mountFile(`${COURSE_RELATIVE_PATH}/en.md`,
                            "# title\nFullstack Mastery")
                        mountFile(`${COURSE_RELATIVE_PATH}/vi.md`,
                            "# title\nFullstack Mastery")

                        const results = await service.parseMany()

                        expect(results).toHaveLength(1)
                        expect(results[0].relativePath).toBe(COURSE_RELATIVE_PATH)
                        expect(winstonService.log).toHaveBeenCalledTimes(1)
                    })
            })

        describe("courseFromDatabase",
            () => {
                it("loads the row by the deterministic course id",
                    async () => {
                        const row = {
                            id: "course-row",
                        }
                        entityManager.findOne.mockResolvedValue(row)

                        const found = await service.courseFromDatabase({
                            courseIndex: 0,
                        })

                        expect(found).toBe(row)
                        const [
                            entity,
                            options,
                        ] = entityManager.findOne.mock.calls[0]
                        expect(entity).toBe(CourseEntity)
                        expect(typeof options.where.id).toBe("string")
                        expect(options.where.id).toHaveLength(36)
                    })

                it("returns null when the course was never seeded",
                    async () => {
                        entityManager.findOne.mockResolvedValue(null)

                        await expect(service.courseFromDatabase({
                            courseIndex: 5,
                        })).resolves.toBeNull()
                    })

                it("resolves authored image keys through MinIO while preserving absolute and empty values",
                    () => {
                        const resolver = service as unknown as {
                            resolvePublicImageUrl: (value: string | null | undefined) => string | undefined
                        }

                        expect(resolver.resolvePublicImageUrl("https://cdn.test/course.png"))
                            .toBe("https://cdn.test/course.png")
                        expect(resolver.resolvePublicImageUrl("///assets/course.png"))
                            .toBe("https://minio.test/public/assets/course.png")
                        expect(resolver.resolvePublicImageUrl("   ")).toBeUndefined()
                        expect(buildPublicObjectUrl).toHaveBeenCalledWith(expect.objectContaining({
                            key: "assets/course.png",
                        }))
                    })
            })
    })
