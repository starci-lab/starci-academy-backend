import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    LessonVideoEntity,
    LessonVideoTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"

/**
 * Inserts/updates/deletes lesson-video-level tables:
 * lesson_videos, lesson_video_translations.
 */
@Injectable()
export class LessonVideoInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single lesson video and its translations.
     */
    async insert(
        lesson: DeepPartial<LessonVideoEntity>
    ): Promise<void> {
        /** 1. Upsert the lesson video row (strip translations) */
        const {
            translations,
            ...rest
        } = lesson

        await this.upsertService.upsertUuid(
            LessonVideoEntity,
            [rest],
        )

        /** 2. Upsert lesson video translations */
        if (translations?.length) {
            await this.upsertService.upsertTranslation<LessonVideoTranslationEntity>(
                LessonVideoTranslationEntity,
                translations,
                {
                    lessonVideoId: lesson.id 
                },
            )
        }
    }

    /**
     * Delete stale lesson videos for a content.
     */
    async deleteStale(
        seedLessonIds: string[],
        contentId: string,
    ): Promise<void> {
        await this.upsertService.deleteStaleUuid<LessonVideoEntity>(
            LessonVideoEntity,
            seedLessonIds,
            {
                content: {
                    id: contentId 
                } 
            },
        )
    }
}
