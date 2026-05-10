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

        /** 1. Upsert the task row (strip nested relations) */
        const {
            translations,
            criteria,
            milestone,
            ...rest
        } = task

        await this.upsertService.upsertUuid(
            MilestoneTaskEntity,
            [{
                ...rest,
                /** Re-attach only the FK reference */
                ...(milestone ? {
                    milestone 
                } : {
                }),
            }],
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
        if (criteria) {
            for (const criterion of criteria) {
                const criterionId = criterion.id as string
                const {
                    translations: criteriaTranslations,
                    ...criterionRest
                } = criterion

                await this.upsertService.upsertUuid(
                    MilestoneTaskCriteriaEntity,
                    [criterionRest],
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
                criteria.map((c) => c.id as string),
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
