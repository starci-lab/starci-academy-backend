import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    MilestoneTaskEntity,
    MilestoneTaskTranslationEntity,
    MilestoneTaskCriteriaEntity,
    MilestoneTaskCriteriaTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"
import {
    deleteFields,
} from "../utils"

/**
 * Inserts/updates/deletes milestone-task-level tables:
 * milestone_tasks, milestone_task_translations,
 * milestone_task_criteria, milestone_task_criteria_translations.
 */
@Injectable()
export class MilestoneTaskInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single task, its translations, and its criteria + criteria translations.
     */
    async insert(
        task: DeepPartial<MilestoneTaskEntity>,
    ): Promise<void> {
        const taskId = task.id as string
        const translations = task.translations
        const criterias = task.criterias
        const milestoneId = (task.milestoneId ?? task.milestone?.id) as string
        const milestoneRef = task.milestone ?? {
            id: milestoneId,
        }

        /** 1. Upsert the task row (strip nested relations) */
        const taskRow = deleteFields(
            task,
            [
                "translations",
                "criterias",
                "milestone",
            ],
        )

        await this.upsertService.upsertUuid(
            MilestoneTaskEntity,
            [{
                ...taskRow,
                milestone: milestoneRef,
            }],
            {
                milestone: {
                    id: milestoneId,
                },
            },
        )

        /** 2. Upsert task translations */
        if (translations) {
            await this.upsertService.upsertTranslation(
                MilestoneTaskTranslationEntity,
                translations,
                {
                    milestoneTaskId: taskId,
                },
            )
        }

        /** 3. Upsert criteria + their translations */
        if (criterias) {
            for (const criterion of criterias) {
                const criterionId = criterion.id as string
                const criteriaTranslations = criterion.translations
                const criterionRow = deleteFields(
                    criterion,
                    [
                        "translations",
                        "milestoneTask",
                    ],
                )

                await this.upsertService.upsertUuid(
                    MilestoneTaskCriteriaEntity,
                    [{
                        ...criterionRow,
                        milestoneTask: criterion.milestoneTask ?? {
                            id: taskId,
                        },
                    }],
                    {
                        milestoneTask: {
                            id: taskId,
                        },
                    },
                )

                if (criteriaTranslations?.length) {
                    await this.upsertService.upsertTranslation<MilestoneTaskCriteriaTranslationEntity>(
                        MilestoneTaskCriteriaTranslationEntity,
                        criteriaTranslations,
                        {
                            milestoneTaskCriteriaId: criterionId,
                        },
                    )
                }
            }

            /** Delete stale criteria for this task */
            await this.upsertService.deleteStaleUuid<MilestoneTaskCriteriaEntity>(
                MilestoneTaskCriteriaEntity,
                criterias.map((c) => c.id as string),
                {
                    milestoneTask: {
                        id: taskId,
                    },
                },
            )
        }
    }

    /**
     * Delete stale tasks for a milestone.
     */
    async deleteStale(
        ids: Array<string>,
        milestoneId: string,
    ): Promise<void> {
        await this.upsertService.deleteStaleUuid<MilestoneTaskEntity>(
            MilestoneTaskEntity,
            ids,
            {
                milestone: {
                    id: milestoneId,
                },
            },
        )
    }
}
