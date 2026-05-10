import type {
    ParseMilestoneTaskParams,
    ParseMilestoneTaskManyParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    PersonalProjectTaskType,
    MilestoneTaskEntity,
    MilestoneTaskTranslationEntity,
    MilestoneTaskCriteriaEntity,
    MilestoneTaskCriteriaTranslationEntity,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
} from "../extracts"
import {
    MilestoneTaskIdFactoryService,
    MilestoneTaskPassCriteriaIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    MilestoneTaskPathService,
    ResolvedFileResult,
} from "../path"
import {
    ContextLoaderService,
} from "../contexts"

const TASK_TYPE_MAP: Record<string, PersonalProjectTaskType> = {
    design: PersonalProjectTaskType.Design,
    techIntegrate: PersonalProjectTaskType.TechIntegrate,
    business: PersonalProjectTaskType.Business,
}

/**
 * Parses milestone-task data from mounted course files (`en.md`, `vi.md`).
 * Criteria are parsed inline from the same markdown file (`# criterias` section).
 */
@Injectable()
export class MilestoneTaskParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly milestoneTaskIdFactoryService: MilestoneTaskIdFactoryService,
        private readonly criteriaIdFactoryService: MilestoneTaskPassCriteriaIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly milestoneTaskPathService: MilestoneTaskPathService,
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
            throw new Error(`Milestone task path not found for index ${taskIndex}`)
        }
        const jsonMap = new Map<Locale, Record<string, any>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(`${path.relativePath}/${locale}.md`),
                ),
            )
        }
        const taskId = this.milestoneTaskIdFactoryService.generate(
            {
                courseIndex,
                milestoneIndex,
                taskIndex,
            },
        )
        const enTask = jsonMap.get(Locale.En) ?? {
        }

        return {
            id: taskId,
            title: enTask.title ?? "",
            description: enTask.description ?? "",
            hint: enTask.hint ?? "",
            orderIndex: this.coerceMdScalarService.toRequiredNumber(
                enTask.orderIndex,
                taskIndex,
            ),
            weight: this.coerceMdScalarService.toRequiredNumber(
                enTask.weight,
                0,
            ),
            type: TASK_TYPE_MAP[enTask.type ?? "business"] ?? PersonalProjectTaskType.Business,
            maxScore: this.coerceMdScalarService.toRequiredNumber(
                enTask.maxScore,
                0,
            ),
            defaultLocale: Locale.En,
            translations: (() => {
                const translations: Array<DeepPartial<MilestoneTaskTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    const json = jsonMap.get(locale)
                    if (json?.title) {
                        translations.push({
                            milestoneTaskId: taskId,
                            locale,
                            field: "title",
                            value: json.title as string,
                        })
                    }
                    if (json?.description) {
                        translations.push({
                            milestoneTaskId: taskId,
                            locale,
                            field: "description",
                            value: json.description as string,
                        })
                    }
                    if (json?.hint) {
                        translations.push({
                            milestoneTaskId: taskId,
                            locale,
                            field: "hint",
                            value: json.hint as string,
                        })
                    }
                }
                return translations
            })(),
            /** Parse criteria inline from the same markdown file. */
            criteria: (() => {
                const enCriteriaArray: Array<any> = enTask.criterias ?? enTask.criteria ?? []
                return enCriteriaArray.map(
                    (enCriteria: any, criteriaIndex: number) => {
                        const criteriaId = this.criteriaIdFactoryService.generate(
                            {
                                courseIndex,
                                milestoneIndex,
                                taskIndex,
                                criteriaIndex,
                            },
                        )
                        const translations: Array<DeepPartial<MilestoneTaskCriteriaTranslationEntity>> = []
                        for (const locale of Object.values(Locale)) {
                            const json = jsonMap.get(locale)
                            const localeCriteriaArray: Array<any> = json?.criterias ?? json?.criteria ?? []
                            const localeCriteria = localeCriteriaArray[criteriaIndex]
                            if (!localeCriteria) continue
                            if (localeCriteria.text) {
                                translations.push({
                                    milestoneTaskCriteriaId: criteriaId,
                                    locale,
                                    field: "text",
                                    value: localeCriteria.text,
                                })
                            }
                            if (localeCriteria.hint) {
                                translations.push({
                                    milestoneTaskCriteriaId: criteriaId,
                                    locale,
                                    field: "hint",
                                    value: localeCriteria.hint,
                                })
                            }
                            if (localeCriteria.promptText) {
                                translations.push({
                                    milestoneTaskCriteriaId: criteriaId,
                                    locale,
                                    field: "promptText",
                                    value: localeCriteria.promptText,
                                })
                            }
                        }
                        return {
                            id: criteriaId,
                            text: (enCriteria.text as string) ?? "",
                            hint: (enCriteria.hint as string) ?? "",
                            promptText: (enCriteria.promptText as string) ?? "",
                            orderIndex: this.coerceMdScalarService.toRequiredNumber(
                                enCriteria.orderIndex,
                                criteriaIndex,
                            ),
                            score: this.coerceMdScalarService.toRequiredNumber(
                                enCriteria.score,
                                10,
                            ),
                            defaultLocale: Locale.En,
                            milestoneTask: {
                                id: taskId,
                            },
                            translations,
                        } as DeepPartial<MilestoneTaskCriteriaEntity>
                    },
                )
            })(),
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
        }
        return data
    }
}
