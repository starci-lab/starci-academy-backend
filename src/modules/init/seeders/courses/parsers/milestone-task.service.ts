import type {
    MilestoneTasksFromDatabaseParams,
    ParseMilestoneTaskParams,
    ParseMilestoneTaskManyParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    PersonalProjectTaskType,
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    ContextLoaderService,
    ResolvedFileResult,
    MergeJsonService,
    MergeJsonResult,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    MilestoneIdFactoryService,
    MilestoneTaskIdFactoryService,
    MilestoneTaskBriefIdFactoryService,
    MilestoneTaskOutcomeCriteriaIdFactoryService,
    MilestoneTaskOutcomeCriteriaLangIdFactoryService,
    MilestoneTaskApproachCriteriaIdFactoryService,
    MilestoneTaskApproachCriteriaLangIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    MilestoneTaskPathNotFoundException,
} from "@modules/exceptions"
import {
    MilestoneTaskPathService,
} from "../path"
import {
    WinstonService,
} from "@modules/winston"

const TASK_TYPE_MAP: Record<string, PersonalProjectTaskType> = {
    design: PersonalProjectTaskType.Design,
    techIntegrate: PersonalProjectTaskType.TechIntegrate,
    business: PersonalProjectTaskType.Business,
}

/**
 * One outcome/approach grading criterion as authored under a language block (`#### N` →
 * `{ body, score, critical }`). Outcome prose is agnostic; approach prose differs per language.
 */
interface MergedCriterion {
    body?: string
    score?: unknown
    critical?: unknown
    orderIndex?: unknown
    sortIndex?: unknown
}

/**
 * One per-language brief block (`# criterias` → `## N`) after extract+merge: the learner-facing
 * `body` carries aligned `translations[]`; `outcome`/`approach` are English-only criterion lists.
 */
interface MergedLangBlock {
    lang?: string
    body?: string
    outcome?: Array<MergedCriterion>
    approach?: Array<MergedCriterion>
    orderIndex?: unknown
    sortIndex?: unknown
    translations?: Array<{ locale: Locale, field: string, value: string }>
}

/**
 * Default-locale milestone-task doc produced by {@link MergeJsonService}: scalar headings plus the
 * lang-first `criterias` blocks and the task-level `translations[]`.
 */
interface MergedMilestoneTask {
    title?: string
    description?: string
    type?: string
    weight?: unknown
    orderIndex?: unknown
    sortIndex?: unknown
    maxScore?: unknown
    verified?: unknown
    criterias?: Array<MergedLangBlock>
    translations?: Array<{ locale: Locale, field: string, value: string }>
}

/**
 * Parses milestone-task data from mounted course files (`en.md`, `vi.md`).
 * Criteria are parsed inline from the same markdown file (`# criterias` section).
 *
 * Follows the canonical mount-parse pattern (`.claude/pattern/16-mount-parsing.md`): extract once per
 * locale, merge via {@link MergeJsonService} with dot-path `translateFields`, then render straight
 * from `merged` — every array item already carries its aligned `translations[]`.
 */
@Injectable()
export class MilestoneTaskParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly milestoneTaskIdFactoryService: MilestoneTaskIdFactoryService,
        private readonly briefIdFactoryService: MilestoneTaskBriefIdFactoryService,
        private readonly outcomeCriteriaIdFactoryService: MilestoneTaskOutcomeCriteriaIdFactoryService,
        private readonly outcomeCriteriaLangIdFactoryService: MilestoneTaskOutcomeCriteriaLangIdFactoryService,
        private readonly approachCriteriaIdFactoryService: MilestoneTaskApproachCriteriaIdFactoryService,
        private readonly approachCriteriaLangIdFactoryService: MilestoneTaskApproachCriteriaLangIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly milestoneTaskPathService: MilestoneTaskPathService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly winstonService: WinstonService,
        private readonly milestoneIdFactoryService: MilestoneIdFactoryService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Builds a partial milestone-task entity (with criteria) from mounted course files.
     */
    async parse(
        {
            paths,
            courseIndex,
            milestoneIndex,
            taskIndex,
        }: ParseMilestoneTaskParams,
    ): Promise<DeepPartial<MilestoneTaskEntity>> {
        const path = paths.find(
            (path) => path.orderIndex === taskIndex,
        )
        if (!path) {
            throw new MilestoneTaskPathNotFoundException(
                {
                    taskIndex,
                },
            )
        }
        // extract the heading structure for every locale's markdown file, normalizing the criteria
        // section key (the mount may name it singular `criteria` or plural `criterias`)
        const jsonMap = new Map<Locale, Record<string, unknown>>()
        for (const locale of Object.values(Locale)) {
            const extracted = this.extractJsonFromMdService.extract(
                await this.contextLoaderService.load(
                    "courses",
                    `${path.relativePath}/${locale}.md`,
                ),
            ) as Record<string, unknown>
            const normalized = {
                ...extracted,
                criterias: extracted.criterias ?? extracted.criteria,
            }
            jsonMap.set(
                locale,
                normalized,
            )
        }
        // merge locales into one default-locale doc + aligned translation rows per i18n field
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: jsonMap.get(locale) ?? {
                },
            })),
            translateFields: [
                "title",
                "description",
                // each `# criterias` item is a per-language brief block; only its learner-facing
                // `body` is i18n. The outcome/approach grading prose is English-only (never merged).
                "criterias.body",
            ],
        }) as MergeJsonResult<MergedMilestoneTask>
        const taskId = this.milestoneTaskIdFactoryService.generate(
            {
                courseIndex,
                milestoneIndex,
                taskIndex,
            },
        )

        // every `# criterias` item is a per-language brief block; the brief `body` is i18n, while
        // its outcome/approach grading criteria are agnostic-/per-language English-only rubrics
        const langBlocks: Array<MergedLangBlock> = merged.criterias ?? []
        // outcome criteria are identical across the language blocks → pivot off the first block
        const outcomeRefs: Array<MergedCriterion> = langBlocks[0]?.outcome ?? []
        const approachRefs: Array<MergedCriterion> = langBlocks[0]?.approach ?? []

        return {
            id: taskId,
            title: merged.title ?? "",
            description: merged.description ?? "",
            hint: "",
            orderIndex: this.coerceMdScalarService.toRequiredNumber(
                merged.orderIndex,
                taskIndex,
            ),
            // pure display-ordering index — explicit `# sortIndex`, else falls back to orderIndex
            sortIndex: this.toSortIndex(
                merged.sortIndex,
                this.coerceMdScalarService.toRequiredNumber(
                    merged.orderIndex,
                    taskIndex,
                ),
            ),
            weight: this.coerceMdScalarService.toRequiredNumber(
                merged.weight,
                0,
            ),
            type: TASK_TYPE_MAP[merged.type as string] ?? PersonalProjectTaskType.Business,
            maxScore: this.coerceMdScalarService.toRequiredNumber(
                merged.maxScore,
                100,
            ),
            // `# verified` (non-null) marks this as a SCHEMA V2 task graded by outcome/approach rubric
            verified: this.coerceMdScalarService.toNullableDate(
                merged.verified,
            ),
            defaultLocale: Locale.En,
            translations: (merged.translations ?? []).map(
                ({
                    locale,
                    field,
                    value,
                }) => ({
                    milestoneTaskId: taskId,
                    locale,
                    field,
                    value,
                }),
            ),
            /** One learner-facing brief per language block (`# criterias` → `## N`); body is i18n. */
            briefs: langBlocks.map(
                (langBlock, briefIndex) => {
                    const briefId = this.briefIdFactoryService.generate(
                        {
                            courseIndex,
                            milestoneIndex,
                            taskIndex,
                            briefIndex,
                        },
                    )
                    return {
                        id: briefId,
                        lang: langBlock.lang ?? "",
                        body: langBlock.body ?? "",
                        orderIndex: briefIndex,
                        sortIndex: typeof langBlock.sortIndex === "number" ? langBlock.sortIndex : briefIndex,
                        defaultLocale: Locale.En,
                        milestoneTask: {
                            id: taskId,
                        },
                        translations: (langBlock.translations ?? []).map(({
                            locale,
                            field,
                            value,
                        }) => ({
                            milestoneTaskBriefId: briefId,
                            locale,
                            field,
                            value,
                        })),
                    }
                },
            ),
            /** Outcome rubric (agnostic across languages): one criterion, prose per language block. */
            outcomeCriteria: outcomeRefs.map(
                (ref, criterionIndex) => {
                    const criterionId = this.outcomeCriteriaIdFactoryService.generate(
                        {
                            courseIndex,
                            milestoneIndex,
                            taskIndex,
                            criterionIndex,
                        },
                    )
                    return {
                        id: criterionId,
                        orderIndex: criterionIndex,
                        sortIndex: typeof ref.sortIndex === "number" ? ref.sortIndex : criterionIndex,
                        score: this.coerceMdScalarService.toRequiredNumber(
                            ref.score,
                            10,
                        ),
                        critical: String(ref.critical) === "true",
                        milestoneTask: {
                            id: taskId,
                        },
                        langs: langBlocks.map(
                            (langBlock, langIndex) => ({
                                id: this.outcomeCriteriaLangIdFactoryService.generate(
                                    {
                                        courseIndex,
                                        milestoneIndex,
                                        taskIndex,
                                        criterionIndex,
                                        langIndex,
                                    },
                                ),
                                lang: langBlock.lang ?? "",
                                body: langBlock.outcome?.[criterionIndex]?.body ?? "",
                                outcomeCriteria: {
                                    id: criterionId,
                                },
                            }),
                        ),
                    }
                },
            ),
            /** Approach rubric (per-language prose differs across language blocks). */
            approachCriteria: approachRefs.map(
                (ref, criterionIndex) => {
                    const criterionId = this.approachCriteriaIdFactoryService.generate(
                        {
                            courseIndex,
                            milestoneIndex,
                            taskIndex,
                            criterionIndex,
                        },
                    )
                    return {
                        id: criterionId,
                        orderIndex: criterionIndex,
                        sortIndex: typeof ref.sortIndex === "number" ? ref.sortIndex : criterionIndex,
                        score: this.coerceMdScalarService.toRequiredNumber(
                            ref.score,
                            10,
                        ),
                        critical: String(ref.critical) === "true",
                        milestoneTask: {
                            id: taskId,
                        },
                        langs: langBlocks.map(
                            (langBlock, langIndex) => ({
                                id: this.approachCriteriaLangIdFactoryService.generate(
                                    {
                                        courseIndex,
                                        milestoneIndex,
                                        taskIndex,
                                        criterionIndex,
                                        langIndex,
                                    },
                                ),
                                lang: langBlock.lang ?? "",
                                body: langBlock.approach?.[criterionIndex]?.body ?? "",
                                approachCriteria: {
                                    id: criterionId,
                                },
                            }),
                        ),
                    }
                },
            ),
        }
    }

    /**
     * Resolves the `# sortIndex` mount value (pure display order), falling back to the
     * task's `orderIndex` when it is missing or not a finite number.
     *
     * @param raw - Raw scalar read from the task mount file
     * @param fallback - The orderIndex to use when `# sortIndex` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback
    }

    /**
     * Parses many milestone-tasks from the mount.
     *
     * @param milestoneRelativePath - Milestone relative path
     * @param courseIndex - Course index
     * @param milestoneIndex - Milestone index
     * @returns Entities-shaped graphs for TypeORM cascade save
     */
    async parseMany(
        {
            milestoneRelativePath,
            courseIndex,
            milestoneIndex,
        }: ParseMilestoneTaskManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<MilestoneTaskEntity>>>> {
        const paths = await this.milestoneTaskPathService.paths(
            {
                milestoneRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<MilestoneTaskEntity>>> = []
        for (const path of paths) {
            try {
                const task = await this.parse(
                    {
                        paths,
                        courseIndex,
                        milestoneIndex,
                        taskIndex: path.orderIndex,
                    },
                )
                data.push({
                    data: task,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    MilestoneTaskEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }

    /**
     * Loads persisted milestone tasks for one milestone (DB inspection / sync checks).
     *
     * @param params - Course/milestone ordinals on the mount.
     * @returns Task rows keyed by deterministic `milestoneId`.
     */
    async milestoneTasksFromDatabase(
        params: MilestoneTasksFromDatabaseParams,
    ): Promise<Array<MilestoneTaskEntity>> {
        const {
            courseIndex,
            milestoneIndex,
        } = params
        const milestoneId = this.milestoneIdFactoryService.generate({
            courseIndex,
            milestoneIndex,
        })
        return this.entityManager.find(MilestoneTaskEntity,
            {
                where: {
                    milestone: {
                        id: milestoneId,
                    },
                },
            })
    }
}
