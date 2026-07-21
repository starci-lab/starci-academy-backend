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
    ChallengeDifficulty,
    Locale,
} from "@modules/databases"
import {
    Sha256Service,
} from "@modules/crypto"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    MergeJsonService,
    ContextLoaderService,
} from "../../shared"
import {
    CourseIdFactoryService,
    FlashcardDeckIdFactoryService,
    FlashcardCardIdFactoryService,
} from "../id-factories"
import {
    WinstonService,
} from "@modules/winston"
import {
    FlashcardDeckPathService,
} from "../path"
import {
    FlashcardDeckParserService,
} from "./flashcard-deck.service"

const COURSES_MOUNT_ROOT = path.join(
    process.cwd(),
    ".mount/data/courses",
)

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
                            COURSES_MOUNT_ROOT,
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
                                const cardsDir = path.join(COURSES_MOUNT_ROOT,
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
