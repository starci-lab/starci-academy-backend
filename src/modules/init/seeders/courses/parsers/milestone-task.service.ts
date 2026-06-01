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
    MilestoneTaskCriteriaEntity,
    MilestoneTaskCodeImplementationEntity,
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
    MilestoneTaskPassCriteriaIdFactoryService,
    MilestoneTaskCodeImplementationIdFactoryService,
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
        private readonly criteriaIdFactoryService: MilestoneTaskPassCriteriaIdFactoryService,
        private readonly codeImplementationIdFactoryService: MilestoneTaskCodeImplementationIdFactoryService,
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
                "hint",
                "criterias.text",
                "criterias.hint",
                "criterias.promptText",
                "codeImplementations.guide",
                "codeImplementations.example",
            ],
        }) as MergeJsonResult<DeepPartial<MilestoneTaskEntity>>
        const taskId = this.milestoneTaskIdFactoryService.generate(
            {
                courseIndex,
                milestoneIndex,
                taskIndex,
            },
        )

        return {
            id: taskId,
            title: merged.title ?? "",
            description: merged.description ?? "",
            hint: merged.hint ?? "",
            orderIndex: this.coerceMdScalarService.toRequiredNumber(
                merged.orderIndex,
                taskIndex,
            ),
            weight: this.coerceMdScalarService.toRequiredNumber(
                merged.weight,
                0,
            ),
            type: TASK_TYPE_MAP[merged.type as string] ?? PersonalProjectTaskType.Business,
            maxScore: this.coerceMdScalarService.toRequiredNumber(
                merged.maxScore,
                0,
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
            /** Parse criteria inline from the same markdown file (`# criterias`). */
            criterias: ((merged.criterias ?? []) as Array<DeepPartial<MilestoneTaskCriteriaEntity>>).map(
                (item, criteriaIndex) => {
                    const criteriaId = this.criteriaIdFactoryService.generate(
                        {
                            courseIndex,
                            milestoneIndex,
                            taskIndex,
                            criteriaIndex: item.orderIndex ?? criteriaIndex,
                        },
                    )
                    return {
                        id: criteriaId,
                        text: (item.text as string) ?? "",
                        hint: (item.hint as string) ?? "",
                        promptText: (item.promptText as string) ?? "",
                        orderIndex: this.coerceMdScalarService.toRequiredNumber(
                            item.orderIndex,
                            criteriaIndex,
                        ),
                        score: this.coerceMdScalarService.toRequiredNumber(
                            item.score,
                            10,
                        ),
                        defaultLocale: Locale.En,
                        milestoneTask: {
                            id: taskId,
                        },
                        translations: (item.translations ?? []).map(({
                            locale,
                            field,
                            value,
                        }) => ({
                            milestoneTaskCriteriaId: criteriaId,
                            locale,
                            field,
                            value,
                        })),
                    }
                },
            ),
            /** Parse code implementations inline from the same markdown file (`# codeImplementations`). */
            codeImplementations: ((merged.codeImplementations ?? []) as Array<DeepPartial<MilestoneTaskCodeImplementationEntity>>).map(
                (item, implementationIndex) => {
                    const implementationId = this.codeImplementationIdFactoryService.generate(
                        {
                            courseIndex,
                            milestoneIndex,
                            taskIndex,
                            implementationIndex: item.orderIndex ?? implementationIndex,
                        },
                    )
                    return {
                        id: implementationId,
                        lang: this.coerceMdScalarService.toRequiredString(
                            item.lang,
                            "text",
                        ),
                        guide: (item.guide as string) ?? "",
                        example: (item.example as string) ?? "",
                        orderIndex: this.coerceMdScalarService.toRequiredNumber(
                            item.orderIndex,
                            implementationIndex,
                        ),
                        defaultLocale: Locale.En,
                        milestoneTask: {
                            id: taskId,
                        },
                        translations: (item.translations ?? []).map(({
                            locale,
                            field,
                            value,
                        }) => ({
                            milestoneTaskCodeImplementationId: implementationId,
                            locale,
                            field,
                            value,
                        })),
                    }
                },
            ),
        }
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
