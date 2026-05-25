import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    MilestoneEntity,
    MilestoneTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"
import {
    deleteFields,
} from "../utils"

/**
 * Inserts/updates/deletes milestone-level tables:
 * milestones, milestone_translations.
 * Tasks and criteria are handled by MilestoneTaskInsertService.
 */
@Injectable()
export class MilestoneInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single milestone and its translations.
     * Tasks are NOT handled here — see MilestoneTaskInsertService.
     */
    async insert(
        milestone: DeepPartial<MilestoneEntity>,
    ): Promise<void> {
        const milestoneId = milestone.id as string
        const translations = milestone.translations
        const courseId = (milestone.courseId ?? milestone.course?.id) as string
        const courseRef = milestone.course ?? {
            id: courseId,
        }

        /** 1. Upsert the milestone row (strip nested relations) */
        const milestoneRow = deleteFields(
            milestone,
            [
                "translations",
                "course",
                "tasks",
            ],
        )

        await this.upsertService.upsertUuid(
            MilestoneEntity,
            [{
                ...milestoneRow,
                course: courseRef,
            }],
            {
                course: {
                    id: courseId,
                },
            },
        )

        /** 2. Upsert milestone translations */
        if (translations) {
            await this.upsertService.upsertTranslation(
                MilestoneTranslationEntity,
                translations,
                {
                    milestoneId,
                },
            )
        }
    }

    /**
     * Delete stale milestones for a course.
     */
    async deleteStale(
        ids: Array<string>,
        courseId: string,
    ): Promise<void> {
        await this.upsertService.deleteStaleUuid<MilestoneEntity>(
            MilestoneEntity,
            ids,
            {
                course: {
                    id: courseId,
                },
            },
        )
    }
}
