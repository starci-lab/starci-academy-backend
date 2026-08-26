import path from "path"
import fs from "fs/promises"
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
    COURSE_PARSER_FIXTURE_ROOT,
} from "@tests/fixtures/course-parser/root"
import {
    ChallengeDifficulty,
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    Sha256Service,
} from "@modules/crypto/sha256.service"
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
    FlashcardCardIdFactoryService,
} from "../id-factories/flashcard-card.service"
import {
    FlashcardDeckIdFactoryService,
} from "../id-factories/flashcard-deck.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    FlashcardDeckPathService,
} from "../path/flashcard-deck.service"
import {
    FlashcardDeckParserService,
} from "./flashcard-deck.service"

/** Relative path to the Module 1 (backend foundations) flashcard deck (themed deck 0). */
const NESTJS_WARMUP_DECK_RELATIVE_PATH =
    "0-fullstack-mastery/flashcard-decks/0-module-1"

describe("FlashcardDeckParserService",
    () => {
        const createMinimalService = (cardPaths = jest.fn().mockResolvedValue([]),
            merge = jest.fn().mockReturnValue({
                title: "Deck title",
                description: "Deck description",
                difficulty: "senior",
                sortIndex: "not-a-number",
                translations: [],
            })) => {
            const paths = jest.fn().mockResolvedValue([])
            const find = jest.fn().mockResolvedValue([])
            const service = new FlashcardDeckParserService(
                {
                    cardPaths,
                    paths,
                } as never,
                {
                    load: jest.fn().mockResolvedValue(""),
                } as never,
                {
                    extract: jest.fn().mockReturnValue({
                    }),
                } as never,
                new CoerceMdScalarService(),
                {
                    merge
                } as never,
                {
                    generate: jest.fn().mockReturnValue("deck-id"),
                } as never,
                {
                    generate: jest.fn().mockReturnValue("card-id"),
                } as never,
                {
                    log: jest.fn(),
                } as never,
                {
                    generate: jest.fn().mockReturnValue("course-id"),
                } as never,
                {
                    find,
                } as never,
            )
            return {
                service,
                paths,
                find,
            }
        }

        let module: TestingModule
        let service: FlashcardDeckParserService

        beforeEach(async () => {
            const contextLoaderService = {
                load: jest.fn(
                    async (
                        _baseDir: string,
                        relativePath: string,
                    ): Promise<string> => fs.readFile(
                        path.join(
                            COURSE_PARSER_FIXTURE_ROOT,
                            relativePath,
                        ),
                        "utf8",
                    ),
                ),
            }

            module = await Test.createTestingModule({
                providers: [
                    FlashcardDeckParserService,
                    ExtractJsonFromMdService,
                    CoerceMdScalarService,
                    MergeJsonService,
                    Sha256Service,
                    CourseIdFactoryService,
                    FlashcardDeckIdFactoryService,
                    FlashcardCardIdFactoryService,
                    {
                        provide: ContextLoaderService,
                        useValue: contextLoaderService,
                    },
                    {
                        provide: FlashcardDeckPathService,
                        useValue: {
                            paths: jest.fn(),
                            // list the real per-card folders for the deck under test
                            cardPaths: jest.fn(async (deckRelativePath: string) => {
                                const cardsDir = path.join(COURSE_PARSER_FIXTURE_ROOT,
                                    deckRelativePath,
                                    "cards")
                                const entries = await fs.readdir(cardsDir,
                                    {
                                        withFileTypes: true
                                    })
                                return entries
                                    .filter((entry) => entry.isDirectory())
                                    .map((entry) => {
                                        const match = entry.name.match(/^(\d+)-/)
                                        return {
                                            relativePath: `${deckRelativePath}/cards/${entry.name}`,
                                            orderIndex: match ? Number(match[1]) : 0,
                                            displayId: entry.name.replace(/^\d+-/,
                                                ""),
                                        }
                                    })
                                    .sort((a, b) => a.orderIndex - b.orderIndex)
                            }),
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                            error: jest.fn(),
                            warn: jest.fn(),
                        },
                    },
                    {
                        // entity manager backs flashcardDecksFromDatabase() + ref resolution;
                        // findOne stubbed to null (the warmup deck has no contentRefs/moduleRefs)
                        provide: getEntityManagerToken("primary"),
                        useValue: {
                            findOne: jest.fn().mockResolvedValue(null),
                        },
                    },
                ],
            }).compile()

            service = module.get<FlashcardDeckParserService>(FlashcardDeckParserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("parse",
            () => {
                it("rejects a deck ordinal that is not present in the mount",
                    async () => {
                        await expect(service.parse({
                            paths: [],
                            courseIndex: 0,
                            courseId: "course-1",
                            flashcardDeckIndex: 99,
                        })).rejects.toThrow("Flashcard deck path not found")
                    })

                it(
                    "parses the nestjs-core-interview-warmup-easy deck with Q&A cards + i18n",
                    async () => {
                        const parsed = await service.parse({
                            paths: [
                                {
                                    relativePath: NESTJS_WARMUP_DECK_RELATIVE_PATH,
                                    orderIndex: 0,
                                    displayId: "nestjs-core-and-lifecycle",
                                },
                            ],
                            courseIndex: 0,
                            courseId: "test-course-id",
                            flashcardDeckIndex: 0,
                        })

                        expect(parsed.displayId).toBe("nestjs-core-and-lifecycle")
                        expect(parsed.orderIndex).toBe(0)
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.courseId).toBe("test-course-id")
                        expect((parsed.title?.length ?? 0)).toBeGreaterThan(0)
                        expect(
                            Object.values(ChallengeDifficulty),
                        ).toContain(parsed.difficulty)

                        // open-ended Q&A cards: each carries a Markdown question + answer
                        expect((parsed.cards?.length ?? 0)).toBeGreaterThan(0)
                        expect((parsed.cards?.[0]?.question?.length ?? 0)).toBeGreaterThan(0)
                        expect((parsed.cards?.[0]?.answer?.length ?? 0)).toBeGreaterThan(0)

                        // per-card i18n: Vietnamese question + answer translation rows
                        expect(parsed.cards?.[0]?.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "question",
                                }),
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "answer",
                                }),
                            ]),
                        )

                        // root-level translations carry a Vietnamese deck title row
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "title",
                                }),
                            ]),
                        )
                        // per-card level + tags parsed from the card folders
                        expect(parsed.cards?.[0]?.tags?.length ?? 0).toBeGreaterThan(0)
                    },
                )

                it("coerces invalid difficulty and sortIndex to safe defaults",
                    async () => {
                        const setup = createMinimalService()
                        const parsed = await setup.service.parse({
                            paths: [{
                                relativePath: "course/deck",
                                orderIndex: 4,
                                displayId: "deck",
                            }],
                            courseIndex: 2,
                            courseId: "course-id",
                            flashcardDeckIndex: 4,
                        })

                        expect(parsed.difficulty).toBe(ChallengeDifficulty.Easy)
                        expect(parsed.sortIndex).toBe(4)
                        expect(parsed.cards).toEqual([])
                    })
            },
        )

        it("skips a malformed deck while retaining valid siblings",
            async () => {
                const paths = jest.fn().mockResolvedValue([
                    {
                        relativePath: "course/0-valid",
                        orderIndex: 0,
                        displayId: "valid",
                    },
                    {
                        relativePath: "course/1-invalid",
                        orderIndex: 1,
                        displayId: "invalid",
                    },
                ])
                const parse = jest.fn()
                    .mockResolvedValueOnce({
                        id: "deck-id"
                    })
                    .mockRejectedValueOnce(new Error("bad deck"))
                const log = jest.fn()
                const service = new FlashcardDeckParserService(
                    {
                        paths,
                        cardPaths: jest.fn().mockResolvedValue([]),
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                        log,
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )
                jest.spyOn(service,
                    "parse").mockImplementation(parse)

                const result = await service.parseMany({
                    courseRelativePath: "course",
                    courseIndex: 2,
                    courseId: "course-id",
                })

                expect(result).toHaveLength(1)
                expect(result[0]?.relativePath).toBe("course/0-valid")
                expect(log).toHaveBeenCalledTimes(1)
            })

        it("loads persisted decks using the deterministic course id",
            async () => {
                const setup = createMinimalService()
                setup.find.mockResolvedValue([{
                    id: "deck-id"
                }])

                const result = await setup.service.flashcardDecksFromDatabase({
                    courseIndex: 3,
                })

                expect(result).toEqual([{
                    id: "deck-id"
                }])
                expect(setup.find).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        where: {
                            course: {
                                id: "course-id",
                            },
                        },
                    }),
                )
            })

        it("builds empty deck and card defaults when optional mount sections are absent",
            async () => {
                const cardPaths = jest.fn().mockResolvedValue([{
                    relativePath: "course/deck/cards/0-card",
                    orderIndex: 0,
                    displayId: "card",
                }])
                const merge = jest.fn().mockReturnValue({
                })
                const setup = createMinimalService(cardPaths,
                    merge)
                const internals = setup.service as unknown as {
                    extractJsonFromMdService: {
                        extract: (raw: string) => Record<string, unknown>
                    }
                }
                jest.spyOn(internals.extractJsonFromMdService,
                    "extract")
                    .mockReturnValue({
                        tags: [{
                        }]
                    })

                const result = await setup.service.parse({
                    paths: [{
                        relativePath: "course/deck",
                        orderIndex: 2,
                        displayId: "deck",
                    }],
                    courseIndex: 0,
                    courseId: "course-id",
                    flashcardDeckIndex: 2,
                })

                expect(result.title).toBe("")
                expect(result.description).toBe("")
                expect(result.translations).toEqual([])
                expect(result.cards).toEqual([
                    expect.objectContaining({
                        question: "",
                        answer: null,
                        explanation: null,
                        level: null,
                        tags: [],
                        isPremium: false,
                    }),
                ])
                expect(merge).toHaveBeenCalledTimes(2)
            })

        it("normalizes finite and malformed card sort indexes consistently",
            () => {
                const parser = service as unknown as {
                    toSortIndex: (value: unknown, fallback: number) => number
                }
                expect(parser.toSortIndex(" 8 ",
                    2)).toBe(8)
                expect(parser.toSortIndex(Number.POSITIVE_INFINITY,
                    2)).toBe(2)
                expect(parser.toSortIndex(null,
                    2)).toBe(0)
            })
    },
)
