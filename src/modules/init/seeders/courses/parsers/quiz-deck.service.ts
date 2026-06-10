import type {
    ParseQuizDeckManyParams,
    ParseQuizDeckParams,
    QuizDecksFromDatabaseParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeDifficulty,
    Locale,
    FlashcardCardEntity,
    FlashcardDeckEntity,
} from "@modules/databases"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    CourseIdFactoryService,
    QuizCardIdFactoryService,
    QuizDeckIdFactoryService,
} from "../id-factories"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    QuizDeckPathService,
} from "../path"
import {
    ContextLoaderService,
    CoerceMdScalarService,
    ExtractJsonFromMdService,
    MergeJsonResult,
    MergeJsonService,
    ResolvedFileResult,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    SeedScopeService,
} from "../../../scope"
import {
    QuizDeckPathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"

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
 *
 * Follows the canonical mount-parse pattern (`.claude/pattern/16-mount-parsing.md`): extract once per
 * locale, merge via {@link MergeJsonService} with dot-path `translateFields`, then render straight
 * from `merged` — every array item already carries its aligned `translations[]`.
 */
@Injectable()
export class QuizDeckParserService {
    constructor(
        private readonly quizDeckPathService: QuizDeckPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly quizDeckIdFactoryService: QuizDeckIdFactoryService,
        private readonly quizCardIdFactoryService: QuizCardIdFactoryService,
        private readonly winstonService: WinstonService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly seedScopeService: SeedScopeService,
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
    ): Promise<DeepPartial<FlashcardDeckEntity>> {
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
        // merge locales into one default-locale doc + aligned translation rows per i18n field
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: (jsonMap.get(locale) ?? {
                }) as Record<string, unknown>,
            })),
            translateFields: [
                "title",
                "description",
                "cards.question",
                "cards.answer",
                "cards.explanation",
            ],
        }) as MergeJsonResult<DeepPartial<FlashcardDeckEntity>>
        // deterministic deck id anchored on the owning course + folder ordinal
        const quizDeckId = this.quizDeckIdFactoryService.generate(
            {
                courseIndex,
                quizDeckIndex,
            },
        )
        // optional N:N lesson links — off by default until mount + content seed are ready
        const linkedContentIds = this.seedScopeService.isCoursesQuizLinkContentsEnabled()
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
            // scalar copy is sourced from the merged default-locale doc
            title: merged.title ?? "",
            description: merged.description ?? "",
            // difficulty comes from the `# difficulty` heading; default to easy
            difficulty: merged.difficulty ?? ChallengeDifficulty.Easy,
            orderIndex: quizDeckIndex,
            // emit one translation row per (locale, field) for the deck itself
            translations: (merged.translations ?? []).map(
                ({
                    locale,
                    field,
                    value,
                }) => ({
                    quizDeckId,
                    locale,
                    field,
                    value,
                }),
            ),
            // map each authored card into an entity graph (question + answer + translations)
            cards: ((merged.cards ?? []) as Array<DeepPartial<FlashcardCardEntity>>).map((card) => {
                // deterministic card id under the deck id
                const quizCardId = this.quizCardIdFactoryService.generate(
                    {
                        courseIndex,
                        quizDeckIndex,
                        quizCardIndex: card.orderIndex ?? 0,
                    },
                )
                return {
                    id: quizCardId,
                    orderIndex: card.orderIndex,
                    question: this.coerceMdScalarService.toRequiredString(card.question,
                        ""),
                    // model answer revealed on flip → null when blank (legacy decks)
                    answer: this.coerceMdScalarService.toNullableStringColumn(
                        card.answer,
                    ),
                    // explanation is optional → store null when blank
                    explanation: this.coerceMdScalarService.toNullableStringColumn(
                        card.explanation,
                    ),
                    defaultLocale: Locale.En,
                    deck: {
                        id: quizDeckId,
                    },
                    translations: (card.translations ?? []).map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        quizCardId,
                        locale,
                        field,
                        value,
                    })),
                }
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
    ): Promise<Array<ResolvedFileResult<DeepPartial<FlashcardDeckEntity>>>> {
        // list every `{index}-{slug}` deck folder for this course
        const paths = await this.quizDeckPathService.paths(
            {
                courseRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<FlashcardDeckEntity>>> = []
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
                    FlashcardDeckEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }

    /**
     * Loads persisted quiz decks for one course (DB inspection / sync checks).
     *
     * @param params - Course ordinal on the mount.
     * @returns Quiz deck rows keyed by deterministic `courseId`.
     */
    async quizDecksFromDatabase(
        params: QuizDecksFromDatabaseParams,
    ): Promise<Array<FlashcardDeckEntity>> {
        const {
            courseIndex,
        } = params
        const courseId = this.courseIdFactoryService.generate({
            courseIndex,
        })
        return this.entityManager.find(FlashcardDeckEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                },
            })
    }
}
