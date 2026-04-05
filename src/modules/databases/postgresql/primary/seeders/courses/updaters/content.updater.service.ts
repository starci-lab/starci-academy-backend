import {
    ContentEntity,
    ContentTranslationEntity,
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
import _ from "lodash"
import {
    contentTranslationKey,
    sanitizePrimitiveFields,
} from "../utils"
import {
    ContentReferenceUpdaterService,
} from "./content-reference.updater.service"

/**
 * The service for Contents.
 */
@Injectable()
export class ContentUpdaterService {
    constructor(
        private readonly contentReferenceService: ContentReferenceUpdaterService,
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
        }: UpdateParams<ContentTranslationEntity>
    ) {
        await entityManager.update(
            ContentTranslationEntity,
            {
                contentId: previous.contentId,
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
        }: UpdateParams<Array<ContentTranslationEntity>>
    ) {
        // we get the deleted translations
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            contentTranslationKey,
        )
        // we get the new translations
        const newTranslations = _.differenceBy(
            updated,
            previous,
            contentTranslationKey,
        )
        // we get the updated translations
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            contentTranslationKey,
        )

        // we delete the deleted translations
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                ContentTranslationEntity,
                {
                    contentId: translation.contentId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }

        // we save the new translations
        await entityManager.save(
            ContentTranslationEntity,
            newTranslations,
        )

        // we update the updated translations
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (updatedTranslation) => contentTranslationKey(updatedTranslation) === contentTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    /**
     * Update the content.
     * @param params - The parameters for updating the content.
     * @param params.previous - The previous content.
     * @param params.updated - The updated content.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateContent(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ContentEntity>,
    ) {
        // we update the content
        await entityManager.update(
            ContentEntity,
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
        await this.contentReferenceService.updateContentReferences(
            {
                previous: previous.references ?? [],
                updated: updated.references ?? [],
                entityManager,
            },
        )
    }

    /**
     * Update the contents.
     * @param params - The parameters for updating the contents.
     * @param params.previous - The previous contents.
     * @param params.updated - The updated contents.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateContents(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ContentEntity>>,
    ) {
        // we get the deleted contents
        const deletedContents = _.differenceBy(
            previous,
            updated,
            "id",
        )
        // we get the new contents
        const createdContents = _.differenceBy(
            updated,
            previous,
            "id",
        )
        // we get the updated contents
        const updatedContents = _.intersectionBy(
            previous,
            updated,
            "id",
        )

        // we delete the deleted contents
        await entityManager.delete(
            ContentEntity,
            {
                id: In(deletedContents.map((deletedContent) => deletedContent.id)),
            },
        )

        // we save the new contents
        await entityManager.save(
            ContentEntity,
            createdContents,
        )

        // we update the updated contents
        for (const updatedContent of updatedContents) {
            await this.updateContent(
                {
                    previous: updatedContent,
                    updated: updated.find((candidate) => candidate.id === updatedContent.id)!,
                    entityManager,
                },
            )
        }
    }
}
