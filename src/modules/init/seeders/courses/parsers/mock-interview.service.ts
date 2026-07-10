import type {
    ParseMockInterviewBankManyParams,
    RawMockInterviewBank,
    RawMockInterviewLang,
    RawMockInterviewListItem,
    RawMockInterviewQuestion,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    ModuleEntity,
    MockInterviewEntity,
    MockInterviewLangEntity,
} from "@modules/databases"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    MockInterviewIdFactoryService,
    MockInterviewLangIdFactoryService,
} from "../id-factories"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    MockInterviewPathService,
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
    WinstonService,
} from "@modules/winston"

/**
 * Parses course-level mock-interview TECHNICAL banks from mounted course files
 * (`en.md` / `vi.md`) under `courses/{course}/mock-interview/{N}-bank/`. A bank has
 * no entity of its own (just a `bankSlug` grouping folder) — each question folder
 * becomes one {@link MockInterviewEntity} row directly.
 *
 * Follows the canonical mount-parse pattern: extract once per locale, merge via
 * {@link MergeJsonService} with dot-path `translateFields`, then render straight
 * from `merged` — every array item already carries its aligned `translations[]`.
 * `MergeJsonService` always canonicalizes on `Locale.En` regardless of authoring
 * order, so `defaultLocale` is always set to `Locale.En` here (matches every other
 * course parser — `interview-answer.md`'s "vi.md gốc" is an AUTHORING convention,
 * not a seeding one).
 */
@Injectable()
export class MockInterviewParserService {
    constructor(
        private readonly mockInterviewPathService: MockInterviewPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly mockInterviewIdFactoryService: MockInterviewIdFactoryService,
        private readonly mockInterviewLangIdFactoryService: MockInterviewLangIdFactoryService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Parses every mock-interview bank under a course's `mock-interview/` folder
     * into a flat list of question rows (banks carry no entity of their own).
     *
     * @param params - Course relative path + course ordinal/id.
     * @returns Entity-shaped question graphs for TypeORM cascade upsert.
     */
    async parseMany(
        {
            courseRelativePath,
            courseIndex,
            courseId,
        }: ParseMockInterviewBankManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<MockInterviewEntity>>>> {
        const bankPaths = await this.mockInterviewPathService.paths(
            {
                courseRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<MockInterviewEntity>>> = []
        for (const bankPath of bankPaths) {
            try {
                // bank meta only resolves `# moduleRefs` — no entity row is created for the bank itself
                const bankJsonMap = new Map<Locale, RawMockInterviewBank>()
                for (const locale of Object.values(Locale)) {
                    bankJsonMap.set(
                        locale,
                        this.extractJsonFromMdService.extract<RawMockInterviewBank>(
                            await this.contextLoaderService.load(
                                "courses",
                                `${bankPath.relativePath}/${locale}.md`,
                            ),
                        ),
                    )
                }
                const moduleId = await this.resolveModuleRefId(
                    courseId,
                    bankJsonMap.get(Locale.En)?.moduleRefs,
                )
                const questions = await this.parseQuestions(
                    bankPath.relativePath,
                    bankPath.displayId,
                    courseIndex,
                    bankPath.orderIndex,
                    courseId,
                    moduleId,
                )
                for (const question of questions) {
                    data.push({
                        data: question.data,
                        index: question.index,
                        relativePath: question.relativePath,
                    })
                }
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    MockInterviewEntity,
                    bankPath.relativePath,
                    error,
                )
            }
        }
        return data
    }

    /**
     * Parses the per-question folders under a bank's `questions/` directory.
     *
     * @param bankRelativePath - The bank folder path segment under `courses/`
     * @param bankSlug - The bank folder's `displayId` (stored on every question row)
     * @param courseIndex - Owning course ordinal (for the deterministic question id)
     * @param bankIndex - Owning bank ordinal
     * @param courseId - Owning course id (FK target)
     * @param moduleId - Resolved module id from the bank's `# moduleRefs` (nullable)
     * @returns Question entity partials for TypeORM cascade upsert
     */
    private async parseQuestions(
        bankRelativePath: string,
        bankSlug: string,
        courseIndex: number,
        bankIndex: number,
        courseId: string,
        moduleId: string | null,
    ): Promise<Array<ResolvedFileResult<DeepPartial<MockInterviewEntity>>>> {
        const questionPaths = await this.mockInterviewPathService.questionPaths(bankRelativePath)
        const questions: Array<ResolvedFileResult<DeepPartial<MockInterviewEntity>>> = []
        for (const questionPath of questionPaths) {
            try {
                const questionJsonMap = new Map<Locale, RawMockInterviewQuestion>()
                for (const locale of Object.values(Locale)) {
                    questionJsonMap.set(
                        locale,
                        this.extractJsonFromMdService.extract<RawMockInterviewQuestion>(
                            await this.contextLoaderService.load(
                                "courses",
                                `${questionPath.relativePath}/${locale}.md`,
                            ),
                        ),
                    )
                }
                const merged = this.mergeJsonService.merge({
                    jsons: Object.values(Locale).map((locale) => ({
                        locale,
                        json: (questionJsonMap.get(locale) ?? {
                        }) as Record<string, unknown>,
                    })),
                    translateFields: [
                        "prompt",
                        "idealAnswer",
                        "ownershipSignal",
                        "rubric.value",
                        "followUps.value",
                        "hints.value",
                        "keywords.value",
                        "langs.givenCode",
                    ],
                }) as MergeJsonResult<RawMockInterviewQuestion>
                const questionIndex = questionPath.orderIndex
                const mockInterviewId = this.mockInterviewIdFactoryService.generate(
                    {
                        courseIndex,
                        bankIndex,
                        questionIndex,
                    },
                )
                questions.push({
                    data: {
                        id: mockInterviewId,
                        family: this.coerceMdScalarService.toRequiredString(merged.family,
                            "technical"),
                        kind: this.coerceMdScalarService.toRequiredString(merged.kind,
                            ""),
                        tier: this.coerceMdScalarService.toNullableStringColumn(merged.tier),
                        prompt: this.coerceMdScalarService.toRequiredString(merged.prompt,
                            ""),
                        idealAnswer: this.coerceMdScalarService.toNullableStringColumn(merged.idealAnswer),
                        rubric: this.toStringArray(merged.rubric),
                        followUps: this.toStringArray(merged.followUps),
                        hints: this.toStringArray(merged.hints),
                        keywords: this.toStringArray(merged.keywords),
                        diagram: this.coerceMdScalarService.toNullableStringColumn(merged.diagram),
                        givenCode: this.coerceMdScalarService.toNullableStringColumn(merged.givenCode),
                        givenLang: this.coerceMdScalarService.toNullableStringColumn(merged.givenLang),
                        competency: this.coerceMdScalarService.toNullableStringColumn(merged.competency),
                        ownershipSignal: this.coerceMdScalarService.toNullableStringColumn(merged.ownershipSignal),
                        tags: this.toStringArray(merged.tags),
                        courseId,
                        moduleId,
                        bankSlug,
                        displayId: questionPath.displayId,
                        sortIndex: this.toSortIndex(
                            (merged as { sortIndex?: unknown }).sortIndex,
                            questionIndex,
                        ),
                        isPremium: this.coerceMdScalarService.toRequiredBoolean(merged.isPremium,
                            false),
                        defaultLocale: Locale.En,
                        translations: (merged.translations ?? []).map(({
                            locale,
                            field,
                            value,
                        }) => ({
                            mockInterviewId,
                            locale,
                            field,
                            value,
                        })),
                        langs: this.toLangs(
                            merged.langs,
                            courseIndex,
                            bankIndex,
                            questionIndex,
                            mockInterviewId,
                        ),
                    },
                    index: questionIndex,
                    relativePath: questionPath.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    MockInterviewEntity,
                    questionPath.relativePath,
                    error,
                )
            }
        }
        return questions
    }

    /** Strips `orderIndex`/`translations` wrapper off a merged scalar-list field, keeping only text. */
    private toStringArray(
        items: Array<MergeJsonResult<RawMockInterviewListItem>> | undefined,
    ): Array<string> | null {
        if (!items || items.length === 0) {
            return null
        }
        return items.map((item) => (item.value ?? "").trim()).filter((value) => value.length > 0)
    }

    /** Builds the per-language `givenCode` variant rows (`# langs`) for one question. */
    private toLangs(
        items: Array<MergeJsonResult<RawMockInterviewLang>> | undefined,
        courseIndex: number,
        bankIndex: number,
        questionIndex: number,
        mockInterviewId: string,
    ): Array<DeepPartial<MockInterviewLangEntity>> {
        if (!items || items.length === 0) {
            return []
        }
        return items.map((item, langIndex) => {
            const mockInterviewLangId = this.mockInterviewLangIdFactoryService.generate(
                {
                    courseIndex,
                    bankIndex,
                    questionIndex,
                    langIndex,
                },
            )
            return {
                id: mockInterviewLangId,
                lang: item.lang ?? "",
                givenCode: item.givenCode ?? "",
                orderIndex: langIndex,
                sortIndex: langIndex,
                defaultLocale: Locale.En,
                mockInterview: {
                    id: mockInterviewId,
                },
                translations: (item.translations ?? []).map(({
                    locale,
                    field,
                    value,
                }) => ({
                    mockInterviewLangId,
                    locale,
                    field,
                    value,
                })),
            }
        })
    }

    /**
     * Resolves the `# sortIndex` mount value (pure display order), falling back to
     * the supplied `fallback` (the question folder ordinal) when missing/invalid.
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback
    }

    /**
     * Resolves `# moduleRefs` displayIds to the FIRST matching module id within
     * the owning course (`MockInterviewEntity.moduleId` is a single FK, not N:N).
     *
     * @param courseId - Owning course id (scopes the lookup).
     * @param refs - Parsed `# moduleRefs` rows (each a module `displayId`).
     * @returns The first resolved module id, or null (behavioral banks have none).
     */
    private async resolveModuleRefId(
        courseId: string,
        refs: Array<RawMockInterviewListItem> | undefined,
    ): Promise<string | null> {
        const displayIds = Array.from(
            new Set(
                (refs ?? [])
                    .map((ref) => (ref.value ?? "").trim())
                    .filter((value) => value.length > 0),
            ),
        )
        for (const displayId of displayIds) {
            const module = await this.entityManager.findOne(ModuleEntity,
                {
                    where: {
                        displayId,
                        // `courseId` is a virtual @RelationId — not queryable in `where`;
                        // scope through the relation instead (mirrors flashcard-deck.service.ts).
                        course: {
                            id: courseId,
                        },
                    },
                    select: {
                        id: true,
                    },
                })
            if (module) {
                return module.id
            }
        }
        return null
    }
}
