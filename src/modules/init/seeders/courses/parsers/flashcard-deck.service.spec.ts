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
            },
        )
    },
)
