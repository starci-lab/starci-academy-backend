import {
    PrerequisiteEntity,
    PrerequisiteTranslationEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    In,
} from "typeorm"
import type {
    UpdateParams,
} from "./types"
import {
    prerequisiteTranslationKey,
    sanitizePrimitiveFields,
} from "./utils"
import _ from "lodash"

/**
 * The service for Prerequisites.
 */
@Injectable()
export class PrerequisiteService {
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
        }: UpdateParams<PrerequisiteTranslationEntity>
    ) {
        // we update the translation
        await entityManager.update(
            PrerequisiteTranslationEntity,
            {
                prerequisiteId: previous.prerequisiteId,
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
        }: UpdateParams<Array<PrerequisiteTranslationEntity>>
    ) {
        // we get the deleted translations
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            prerequisiteTranslationKey,
        )
        // we get the new translations
        const newTranslations = _.differenceBy(
            updated,
            previous,
            prerequisiteTranslationKey,
        )
        // we get the updated translations
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            prerequisiteTranslationKey,
        )
        // we delete the deleted translations
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                PrerequisiteTranslationEntity,
                {
                    prerequisiteId: translation.prerequisiteId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        // we save the new translations
        await entityManager.save(
            PrerequisiteTranslationEntity,
            newTranslations,
        )
        // we update the updated translations
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => prerequisiteTranslationKey(candidate) === prerequisiteTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    /**
     * Update the prerequisite.
     * @param params - The parameters for updating the prerequisite.
     * @param params.previous - The previous prerequisite.
     * @param params.updated - The updated prerequisite.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updatePrerequisite(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<PrerequisiteEntity>,
    ) {
        // we update the prerequisite
        await entityManager.update(
            PrerequisiteEntity,
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
     * Update the prerequisites.
     * @param params - The parameters for updating the prerequisites.
     * @param params.previous - The previous prerequisites.
     * @param params.updated - The updated prerequisites.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updatePrerequisites(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<PrerequisiteEntity>>,
    ) {
        // we get the deleted prerequisites
        const deletedPrerequisites = _.differenceBy(
            previous,
            updated,
            "id",
        )
        // we get the new prerequisites
        const createdPrerequisites = _.differenceBy(
            updated,
            previous,
            "id",
        )
        // we get the updated prerequisites
        const updatedPrerequisites = _.intersectionBy(
            previous,
            updated,
            "id",
        )
        // we delete the deleted prerequisites
        await entityManager.delete(
            PrerequisiteEntity,
            {
                id: In(deletedPrerequisites.map((deletedPrerequisite) => deletedPrerequisite.id)),
            },
        )
        // we save the new prerequisites
        await entityManager.save(
            PrerequisiteEntity,
            createdPrerequisites,
        )
        // we update the updated prerequisites
        for (const updatedPrerequisite of updatedPrerequisites) {
            await this.updatePrerequisite(
                {
                    previous: updatedPrerequisite,
                    updated: updated.find((candidate) => candidate.id === updatedPrerequisite.id)!,
                    entityManager,
                },
            )
        }
    }
}

