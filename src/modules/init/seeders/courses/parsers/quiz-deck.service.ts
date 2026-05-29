import type {
    ParseQuizDeckManyParams,
    ParseQuizDeckParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeDifficulty,
    Locale,
    QuizCardEntity,
    QuizCardOptionEntity,
    QuizCardOptionTranslationEntity,
    QuizCardTranslationEntity,
    QuizDeckEntity,
    QuizDeckTranslationEntity,
} from "@modules/databases"
import {
    DeepPartial,
} from "typeorm"
import {
    QuizCardIdFactoryService,
    QuizCardOptionIdFactoryService,
    QuizDeckIdFactoryService,
} from "../id-factories"
import {
    QuizDeckPathService,
} from "../path"
import {
    ContextLoaderService,
    CoerceMdScalarService,
    ExtractJsonFromMdService,
    ResolvedFileResult,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    isCoursesQuizLinkContentsEnabled,
} from "../../shared/scope"
import {
    QuizDeckPathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"

/** One multiple-choice option as parsed from the deck markdown. */
interface RawQuizCardOption {
    /** Zero-based option ordinal. */
    orderIndex: number
    /** Option text. */
    text?: string
    /** Whether this is the correct option (string/boolean from markdown). */
    isCorrect?: string | boolean
}

/** One quiz card (question) as parsed from the deck markdown. */
interface RawQuizCard {
    /** Zero-based card ordinal. */
    orderIndex: number
    /** Question prompt. */
    question?: string
    /** Optional explanation shown after grading. */
    explanation?: string
    /** Answer options. */
    options?: Array<RawQuizCardOption>
}

/** One content link line (`{moduleDisplayId}/{contentDisplayId}`) as parsed. */
interface RawContentRef {
    /** Zero-based ordinal. */
    orderIndex: number
    /** The `{moduleDisplayId}/{contentDisplayId}` path string. */
    value?: string
}

/** A whole deck document as parsed from one locale's markdown. */
interface RawQuizDeck {
    /** Deck title. */
    title?: string
    /** Deck description. */
    description?: string
    /** Deck difficulty tier. */
    difficulty?: ChallengeDifficulty
    /** Cards in the deck. */
    cards?: Array<RawQuizCard>
    /** Optional content links (many-to-many). */
    contents?: Array<RawContentRef>
    /** Index signature so the markdown→JSON extractor generic is satisfied. */
    [key: string]: unknown
}

/**
 * Parses course-level multiple-choice quiz decks from mounted course files
 * (`en.md` / `vi.md`) under `courses/{course}/quiz-decks/`. Scalar fields use
 * camelCase `#` headings in `en.md`; per-locale values become translation rows.
 * An optional `# contents` list links the deck to contents (many-to-many).
 */
@Injectable()
export class QuizDeckParserService {
    constructor(
        private readonly quizDeckPathService: QuizDeckPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly quizDeckIdFactoryService: QuizDeckIdFactoryService,
        private readonly quizCardIdFactoryService: QuizCardIdFactoryService,
        private readonly quizCardOptionIdFactoryService: QuizCardOptionIdFactoryService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Builds a partial quiz deck entity graph from mounted course files.
     *
     * @param params - Deck-locating ordinals, owning course id, and the content map.
     * @returns Entity-shaped graph for TypeORM cascade upsert.
     */
    async parse(
        {
            paths,
            courseIndex,
            courseId,
            quizDeckIndex,
            contentIdByPath,
        }: ParseQuizDeckParams,
    ): Promise<DeepPartial<QuizDeckEntity>> {
        // locate the deck folder for the requested ordinal
        const path = paths.find(
            (path) => path.orderIndex === quizDeckIndex,
        )
        // a missing folder is a hard error — caller logs + skips this deck
        if (!path) {
            throw new QuizDeckPathNotFoundException(
                {
                    quizDeckIndex,
                },
            )
        }
        // load the markdown for every supported locale into a JSON map
        const jsonMap = new Map<Locale, RawQuizDeck>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract<RawQuizDeck>(
                    await this.contextLoaderService.load(
                        "courses",
                        `${path.relativePath}/${locale}.md`,
                    ),
                ),
            )
        }
        // deterministic deck id anchored on the owning course + folder ordinal
        const quizDeckId = this.quizDeckIdFactoryService.generate(
            {
                courseIndex,
                quizDeckIndex,
            },
        )
        // optional N:N lesson links — off by default until mount + content seed are ready
        const linkedContentIds = isCoursesQuizLinkContentsEnabled()
            ? Array.from(
                new Set(
                    (jsonMap.get(Locale.En)?.contents ?? [])
                        .map((ref) => (ref.value ?? "").trim())
                        .filter((value) => value.length > 0)
                        .map((value) => contentIdByPath.get(value))
                        .filter((id): id is string => Boolean(id)),
                ),
            )
            : []
        return {
            id: quizDeckId,
            defaultLocale: Locale.En,
            displayId: path.displayId,
            // owning course FK
            courseId,
            // optional many-to-many content links
            contents: linkedContentIds.map((id) => ({
                id,
            })),
            // scalar copy is sourced from the English document
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: jsonMap.get(Locale.En)?.description ?? "",
            // difficulty comes from the `# difficulty` heading; default to easy
            difficulty: jsonMap.get(Locale.En)?.difficulty ?? ChallengeDifficulty.Easy,
            orderIndex: quizDeckIndex,
            // emit one translation row per (locale, field) for the deck itself
            translations: (() => {
                const translations: Array<DeepPartial<QuizDeckTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        quizDeckId,
                        locale,
                        field: "title",
                        value: jsonMap.get(locale)?.title ?? "",
                    })
                    translations.push({
                        quizDeckId,
                        locale,
                        field: "description",
                        value: jsonMap.get(locale)?.description ?? "",
                    })
                }
                return translations
            })(),
            // map each authored card into an entity graph (options + translations)
            cards: (
                jsonMap.get(Locale.En)?.cards ?? []
            ).map(({
                orderIndex,
                question,
                explanation,
                options,
            }) => {
                // deterministic card id under the deck id
                const quizCardId = this.quizCardIdFactoryService.generate(
                    {
                        courseIndex,
                        quizDeckIndex,
                        quizCardIndex: orderIndex,
                    },
                )
                // per-locale translations for the card text fields
                const cardTranslations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        deck,
                    ]) => (deck.cards ?? [])
                        .filter((card) => card.orderIndex === orderIndex)
                        .map<Array<DeepPartial<QuizCardTranslationEntity>>>((card) => [
                            {
                                quizCardId,
                                locale,
                                field: "question",
                                value: this.coerceMdScalarService.toRequiredString(
                                    card.question,
                                    "",
                                ),
                            },
                            {
                                quizCardId,
                                locale,
                                field: "explanation",
                                value: this.coerceMdScalarService.toRequiredString(
                                    card.explanation,
                                    "",
                                ),
                            },
                        ]),
                ).flat().flat()
                // map each option of this card into an entity + translations
                const cardOptions = (options ?? []).map(({
                    orderIndex: optionOrderIndex,
                    text,
                    isCorrect,
                }) => {
                    // deterministic option id under the card id
                    const quizCardOptionId = this.quizCardOptionIdFactoryService.generate(
                        {
                            courseIndex,
                            quizDeckIndex,
                            quizCardIndex: orderIndex,
                            quizCardOptionIndex: optionOrderIndex,
                        },
                    )
                    // per-locale translation of the option text
                    const optionTranslations = Array.from(jsonMap.entries()).map(
                        ([
                            locale,
                            deck,
                        ]) => {
                            // walk locale → card → option by matching ordinals
                            const localeCard = (deck.cards ?? []).find(
                                (card) => card.orderIndex === orderIndex,
                            )
                            const localeOption = (localeCard?.options ?? []).find(
                                (option) => option.orderIndex === optionOrderIndex,
                            )
                            // skip locales that omit this option entirely
                            if (!localeOption) {
                                return []
                            }
                            return [
                                {
                                    quizCardOptionId,
                                    locale,
                                    field: "text",
                                    value: this.coerceMdScalarService.toRequiredString(
                                        localeOption.text,
                                        "",
                                    ),
                                } as DeepPartial<QuizCardOptionTranslationEntity>,
                            ]
                        },
                    ).flat()
                    return {
                        id: quizCardOptionId,
                        orderIndex: optionOrderIndex,
                        text: this.coerceMdScalarService.toRequiredString(text,
                            ""),
                        // correctness flag drives Test auto-grading
                        isCorrect: this.coerceMdScalarService.toRequiredBoolean(
                            isCorrect,
                            false,
                        ),
                        defaultLocale: Locale.En,
                        card: {
                            id: quizCardId,
                        },
                        translations: optionTranslations,
                    } as DeepPartial<QuizCardOptionEntity>
                })
                return {
                    id: quizCardId,
                    orderIndex,
                    question: this.coerceMdScalarService.toRequiredString(question,
                        ""),
                    // explanation is optional → store null when blank
                    explanation: this.coerceMdScalarService.toNullableStringColumn(
                        explanation,
                    ),
                    defaultLocale: Locale.En,
                    deck: {
                        id: quizDeckId,
                    },
                    options: cardOptions,
                    translations: cardTranslations,
                } as DeepPartial<QuizCardEntity>
            }),
        }
    }

    /**
     * Parses many quiz decks under a course's `quiz-decks/` folder.
     *
     * @param params - Course relative path + course ordinal/id + content map.
     * @returns Entity-shaped graphs for TypeORM cascade upsert.
     */
    async parseMany(
        {
            courseRelativePath,
            courseIndex,
            courseId,
            contentIdByPath,
        }: ParseQuizDeckManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<QuizDeckEntity>>>> {
        // list every `{index}-{slug}` deck folder for this course
        const paths = await this.quizDeckPathService.paths(
            {
                courseRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<QuizDeckEntity>>> = []
        for (const path of paths) {
            try {
                // parse one deck; failures are isolated so siblings still seed
                const deck = await this.parse(
                    {
                        paths,
                        courseIndex,
                        courseId,
                        quizDeckIndex: path.orderIndex,
                        contentIdByPath,
                    },
                )
                data.push({
                    data: deck,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                // log + skip a malformed deck instead of aborting the seed
                logInitSeederEntitySkipped(
                    this.winstonService,
                    QuizDeckEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
}
