import type {
    ParseFlashcardDeckManyParams,
    ParseFlashcardDeckParams,
    FlashcardDecksFromDatabaseParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeDifficulty,
    Locale,
    ContentEntity,
    ModuleEntity,
    FlashcardCardEntity,
    FlashcardDeckEntity,
} from "@modules/databases"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    CourseIdFactoryService,
    FlashcardCardIdFactoryService,
    FlashcardDeckIdFactoryService,
} from "../id-factories"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    FlashcardDeckPathService,
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
    FlashcardDeckPathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"

/** One `# contentRefs` / `# moduleRefs` line (a `displayId`) as parsed. */
interface RawRef {
    /** Zero-based ordinal. */
    orderIndex: number
    /** The referenced entity's `displayId`. */
    value?: string
}

/** A whole deck document as parsed from one locale's markdown. */
interface RawFlashcardDeck {
    /** Deck title. */
    title?: string
    /** Deck description. */
    description?: string
    /** Deck difficulty tier. */
    difficulty?: ChallengeDifficulty
    /** Referenced content `displayId`s (many-to-many). */
    contentRefs?: Array<RawRef>
    /** Referenced module `displayId`s (many-to-many). */
    moduleRefs?: Array<RawRef>
    /** Index signature so the markdown→JSON extractor generic is satisfied. */
    [key: string]: unknown
}

/**
 * Parses course-level multiple-choice flashcard decks from mounted course files
 * (`en.md` / `vi.md`) under `courses/{course}/flashcard-decks/`. Scalar fields use
 * camelCase `#` headings in `en.md`; per-locale values become translation rows.
 * An optional `# contents` list links the deck to contents (many-to-many).
 *
 * Follows the canonical mount-parse pattern (`.claude/pattern/16-mount-parsing.md`): extract once per
 * locale, merge via {@link MergeJsonService} with dot-path `translateFields`, then render straight
 * from `merged` — every array item already carries its aligned `translations[]`.
 */
@Injectable()
export class FlashcardDeckParserService {
    constructor(
        private readonly flashcardDeckPathService: FlashcardDeckPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly flashcardDeckIdFactoryService: FlashcardDeckIdFactoryService,
        private readonly flashcardCardIdFactoryService: FlashcardCardIdFactoryService,
        private readonly winstonService: WinstonService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Builds a partial flashcard deck entity graph from mounted course files.
     *
     * @param params - Deck-locating ordinals, owning course id, and the content map.
     * @returns Entity-shaped graph for TypeORM cascade upsert.
     */
    async parse(
        {
            paths,
            courseIndex,
            courseId,
            flashcardDeckIndex,
        }: ParseFlashcardDeckParams,
    ): Promise<DeepPartial<FlashcardDeckEntity>> {
        // locate the deck folder for the requested ordinal
        const path = paths.find(
            (path) => path.orderIndex === flashcardDeckIndex,
        )
        // a missing folder is a hard error — caller logs + skips this deck
        if (!path) {
            throw new FlashcardDeckPathNotFoundException(
                {
                    flashcardDeckIndex,
                },
            )
        }
        // load the markdown for every supported locale into a JSON map
        const jsonMap = new Map<Locale, RawFlashcardDeck>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract<RawFlashcardDeck>(
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
        const flashcardDeckId = this.flashcardDeckIdFactoryService.generate(
            {
                courseIndex,
                flashcardDeckIndex,
            },
        )
        // N:N refs — resolve `# contentRefs` / `# moduleRefs` displayIds to ids within
        // this course (contents + modules are already seeded by the time decks run)
        const linkedContentIds = await this.resolveContentRefIds(
            courseId,
            jsonMap.get(Locale.En)?.contentRefs,
        )
        const linkedModuleIds = await this.resolveModuleRefIds(
            courseId,
            jsonMap.get(Locale.En)?.moduleRefs,
        )
        return {
            id: flashcardDeckId,
            defaultLocale: Locale.En,
            displayId: path.displayId,
            // owning course FK
            courseId,
            // many-to-many content references (`# contentRefs`)
            contents: linkedContentIds.map((id) => ({
                id,
            })),
            // many-to-many module references (`# moduleRefs`)
            modules: linkedModuleIds.map((id) => ({
                id,
            })),
            // scalar copy is sourced from the merged default-locale doc
            title: merged.title ?? "",
            description: merged.description ?? "",
            // difficulty comes from the `# difficulty` heading; default to easy
            difficulty: merged.difficulty ?? ChallengeDifficulty.Easy,
            orderIndex: flashcardDeckIndex,
            // emit one translation row per (locale, field) for the deck itself
            translations: (merged.translations ?? []).map(
                ({
                    locale,
                    field,
                    value,
                }) => ({
                    flashcardDeckId,
                    locale,
                    field,
                    value,
                }),
            ),
            // map each authored card into an entity graph (question + answer + translations)
            cards: ((merged.cards ?? []) as Array<DeepPartial<FlashcardCardEntity>>).map((card) => {
                // deterministic card id under the deck id
                const flashcardCardId = this.flashcardCardIdFactoryService.generate(
                    {
                        courseIndex,
                        flashcardDeckIndex,
                        flashcardCardIndex: card.orderIndex ?? 0,
                    },
                )
                return {
                    id: flashcardCardId,
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
                        id: flashcardDeckId,
                    },
                    translations: (card.translations ?? []).map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        flashcardCardId,
                        locale,
                        field,
                        value,
                    })),
                }
            }),
        }
    }

    /**
     * Resolves `# contentRefs` displayIds to content ids within the owning course.
     * Contents are already persisted by the time decks seed; unknown displayIds are
     * dropped (logged-skip semantics — a typo shouldn't abort the deck).
     *
     * @param courseId - Owning course id (scopes the lookup).
     * @param refs - Parsed `# contentRefs` rows (each a content `displayId`).
     * @returns Deduped content ids for the many-to-many link.
     */
    private async resolveContentRefIds(
        courseId: string,
        refs: Array<RawRef> | undefined,
    ): Promise<Array<string>> {
        const displayIds = Array.from(
            new Set(
                (refs ?? [])
                    .map((ref) => (ref.value ?? "").trim())
                    .filter((value) => value.length > 0),
            ),
        )
        if (displayIds.length === 0) {
            return []
        }
        const ids: Array<string> = []
        for (const displayId of displayIds) {
            const content = await this.entityManager.findOne(ContentEntity, {
                where: {
                    displayId,
                    module: {
                        course: {
                            id: courseId,
                        },
                    },
                },
                select: {
                    id: true,
                },
            })
            if (content) {
                ids.push(content.id)
            }
        }
        return ids
    }

    /**
     * Resolves `# moduleRefs` displayIds to module ids within the owning course.
     *
     * @param courseId - Owning course id (scopes the lookup).
     * @param refs - Parsed `# moduleRefs` rows (each a module `displayId`).
     * @returns Deduped module ids for the many-to-many link.
     */
    private async resolveModuleRefIds(
        courseId: string,
        refs: Array<RawRef> | undefined,
    ): Promise<Array<string>> {
        const displayIds = Array.from(
            new Set(
                (refs ?? [])
                    .map((ref) => (ref.value ?? "").trim())
                    .filter((value) => value.length > 0),
            ),
        )
        if (displayIds.length === 0) {
            return []
        }
        const ids: Array<string> = []
        for (const displayId of displayIds) {
            const module = await this.entityManager.findOne(ModuleEntity, {
                where: {
                    displayId,
                    courseId,
                },
                select: {
                    id: true,
                },
            })
            if (module) {
                ids.push(module.id)
            }
        }
        return ids
    }

    /**
     * Parses many flashcard decks under a course's `flashcard-decks/` folder.
     *
     * @param params - Course relative path + course ordinal/id.
     * @returns Entity-shaped graphs for TypeORM cascade upsert.
     */
    async parseMany(
        {
            courseRelativePath,
            courseIndex,
            courseId,
        }: ParseFlashcardDeckManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<FlashcardDeckEntity>>>> {
        // list every `{index}-{slug}` deck folder for this course
        const paths = await this.flashcardDeckPathService.paths(
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
                        flashcardDeckIndex: path.orderIndex,
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
     * Loads persisted flashcard decks for one course (DB inspection / sync checks).
     *
     * @param params - Course ordinal on the mount.
     * @returns Flashcard deck rows keyed by deterministic `courseId`.
     */
    async flashcardDecksFromDatabase(
        params: FlashcardDecksFromDatabaseParams,
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
