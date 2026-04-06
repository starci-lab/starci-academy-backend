import {
    LessonVideoEntity,
    LessonVideoTranslationEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    In,
} from "typeorm"
import type {
    UpdateParams,
} from "../types"
import {
    lessonVideoTranslationKey,
    sanitizePrimitiveFields,
} from "../utils"
import _ from "lodash"

/**
 * The service for Lesson Videos.
 */
@Injectable()
export class LessonVideoUpdaterService {
    constructor(
    ) {}

    /**
     * Update the translation.
     * @param params - The parameters for updating the translation.
     * @param params.previous - The previous translation.
     * @param params.updated - The updated translation.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateTranslation(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<LessonVideoTranslationEntity>
    ) {
        // we update the translation
        await entityManager.update(
            LessonVideoTranslationEntity,
            {
                lessonVideoId: previous.lessonVideoId,
                locale: previous.locale,
                field: previous.field,
            },
            sanitizePrimitiveFields(updated),
        )
    }

    /**
     * Update the translations.
     * @param params - The parameters for updating the translations.
     * @param params.previous - The previous translations.
     * @param params.updated - The updated translations.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateTranslations(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<LessonVideoTranslationEntity>>
    ) {
        // we get the deleted translations
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            lessonVideoTranslationKey,
        )
        const newTranslations = _.differenceBy(
            updated,
            previous,
            lessonVideoTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            lessonVideoTranslationKey,
        )
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                LessonVideoTranslationEntity,
                {
                    lessonVideoId: translation.lessonVideoId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        // we save the new translations
        await entityManager.save(
            LessonVideoTranslationEntity,
            newTranslations,
        )
        // we update the updated translations
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => lessonVideoTranslationKey(candidate) === lessonVideoTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    /**
     * Update the lesson video.
     * @param params - The parameters for updating the lesson video.
     * @param params.previous - The previous lesson video.
     * @param params.updated - The updated lesson video.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateLessonVideo(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<LessonVideoEntity>,
    ) {
        // we update the lesson video
        await entityManager.update(
            LessonVideoEntity,
            {
                id: previous.id,
            },
            sanitizePrimitiveFields(updated),
        )
        // we update the translations
        await this.updateTranslations(
            {
                previous: previous.translations,
                updated: updated.translations,
                entityManager,
            },
        )
    }

    /**
     * Update the lesson videos.
     * @param params - The parameters for updating the lesson videos.
     * @param params.previous - The previous lesson videos.
     * @param params.updated - The updated lesson videos.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateLessonVideos(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<LessonVideoEntity>>,
    ) {
        // we get the deleted lesson videos
        const deletedLessonVideos = _.differenceBy(
            previous,
            updated,
            "id",
        )
        // we get the new lesson videos
        const createdLessonVideos = _.differenceBy(
            updated,
            previous,
            "id",
        )
        // we get the updated lesson videos
        const updatedLessonVideos = _.intersectionBy(
            previous,
            updated,
            "id",
        )
        // we delete the deleted lesson videos
        await entityManager.delete(
            LessonVideoEntity,
            {
                id: In(deletedLessonVideos.map((deletedLessonVideo) => deletedLessonVideo.id)),
            },
        )
        // we save the new lesson videos
        await entityManager.save(
            LessonVideoEntity,
            createdLessonVideos,
        )
        // we update the updated lesson videos
        for (const updatedLessonVideo of updatedLessonVideos) {
            await this.updateLessonVideo(
                {
                    previous: updatedLessonVideo,
                    updated: updated.find((candidate) => candidate.id === updatedLessonVideo.id)!,
                    entityManager,
                },
            )
        }
    }
}

