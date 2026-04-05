import {
    PreviewContentEntity,
    PreviewContentTranslationEntity,
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
    previewContentTranslationKey,
    sanitizePrimitiveFields,
} from "../utils"
import _ from "lodash"

/**
 * The service for Preview Content.
 */
@Injectable()
export class PreviewContentUpdaterService {
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
        }: UpdateParams<PreviewContentTranslationEntity>
    ) {
        // we update the translation
        await entityManager.update(
            PreviewContentTranslationEntity,
            {
                previewContentId: previous.previewContentId,
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
        }: UpdateParams<Array<PreviewContentTranslationEntity>>
    ) {
        // we get the deleted translations
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            previewContentTranslationKey,
        )
        // we get the new translations
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            previewContentTranslationKey,
        )
        // we get the updated translations
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            previewContentTranslationKey,
        )
        // we delete the deleted translations
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                PreviewContentTranslationEntity,
                {
                    previewContentId: translation.previewContentId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }

        // we save the new translations
        await entityManager.save(
            PreviewContentTranslationEntity,
            createdTranslations,
        )
        // we update the updated translations
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => previewContentTranslationKey(candidate) === previewContentTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    /**
     * Update the preview content.
     * @param params - The parameters for updating the preview content.
     * @param params.previous - The previous preview content.
     * @param params.updated - The updated preview content.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updatePreviewContent(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<PreviewContentEntity>,
    ) {
        // we update the preview content
        await entityManager.update(
            PreviewContentEntity,
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
     * Update the preview contents.
     * @param params - The parameters for updating the preview contents.
     * @param params.previous - The previous preview contents.
     * @param params.updated - The updated preview contents.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updatePreviewContents(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<PreviewContentEntity>>,
    ) {
        // we get the deleted preview contents
        const deletedPreviewContents = _.differenceBy(
            previous,
            updated,
            "id",
        )
        // we get the new preview contents
        const createdPreviewContents = _.differenceBy(
            updated,
            previous,
            "id",
        )
        // we get the updated preview contents
        const updatedPreviewContents = _.intersectionBy(
            previous,
            updated,
            "id",
        )
        // we delete the deleted preview contents
        await entityManager.delete(
            PreviewContentEntity,
            {
                id: In(deletedPreviewContents.map((deletedPreviewContent) => deletedPreviewContent.id)),
            },
        )
        // we save the new preview contents
        await entityManager.save(
            PreviewContentEntity,
            createdPreviewContents,
        )
        // we update the updated preview contents
        for (const updatedPreviewContent of updatedPreviewContents) {
            await this.updatePreviewContent(
                {
                    previous: updatedPreviewContent,
                    updated: updated.find((candidate) => candidate.id === updatedPreviewContent.id)!,
                    entityManager,
                },
            )
        }
    }
}

