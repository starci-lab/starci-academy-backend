import {
    ValuePropositionEntity,
    ValuePropositionTranslationEntity,
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
    valuePropositionTranslationKey,
    sanitizePrimitiveFields,
} from "../utils"
import _ from "lodash"

/**
 * The service for Value Propositions.
 */
@Injectable()
export class ValuePropositionUpdaterService {
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
        }: UpdateParams<ValuePropositionTranslationEntity>
    ) {
        await entityManager.update(
            ValuePropositionTranslationEntity,
            {
                valuePropositionId: previous.valuePropositionId,
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
        }: UpdateParams<Array<ValuePropositionTranslationEntity>>
    ) {
        // we get the deleted translations
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            valuePropositionTranslationKey,
        )
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            valuePropositionTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            valuePropositionTranslationKey,
        )

        for (const row of deletedTranslations) {
            await entityManager.delete(
                ValuePropositionTranslationEntity,
                {
                    valuePropositionId: row.valuePropositionId,
                    locale: row.locale,
                    field: row.field,
                },
            )
        }

        // we save the new translations
        await entityManager.save(
            ValuePropositionTranslationEntity,
            createdTranslations,
        )

        // we update the updated translations
        for (const updatedTranslation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: updatedTranslation,
                    updated: updated.find(
                        (candidate) => valuePropositionTranslationKey(candidate) === valuePropositionTranslationKey(updatedTranslation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    /**
     * Update the value proposition.
     * @param params - The parameters for updating the value proposition.
     * @param params.previous - The previous value proposition.
     * @param params.updated - The updated value proposition.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateValueProposition(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ValuePropositionEntity>,
    ) {
        await entityManager.update(
            ValuePropositionEntity,
            {
                id: previous.id,
            },
            sanitizePrimitiveFields(updated),
        )

        await this.updateTranslations(
            {
                previous: previous.translations ?? [],
                updated: updated.translations ?? [],
                entityManager,
            },
        )
    }

    /**
     * Update the value propositions.
     * @param params - The parameters for updating the value propositions.
     * @param params.previous - The previous value propositions.
     * @param params.updated - The updated value propositions.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateValuePropositions(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ValuePropositionEntity>>,
    ) {
        // we get the deleted value propositions
        const deletedValuePropositions = _.differenceBy(
            previous,
            updated,
            "id",
        )
        // we get the new value propositions
        const createdValuePropositions = _.differenceBy(
            updated,
            previous,
            "id",
        )
        // we get the updated value propositions
        const updatedValuePropositions = _.intersectionBy(
            previous,
            updated,
            "id",
        )

        // we delete the deleted value propositions
        await entityManager.delete(
            ValuePropositionEntity,
            {
                id: In(deletedValuePropositions.map((deletedValueProposition) => deletedValueProposition.id)),
            },
        )

        // we save the new value propositions
        await entityManager.save(
            ValuePropositionEntity,
            createdValuePropositions,
        )

        // we update the updated value propositions
        for (const updatedValueProposition of updatedValuePropositions) {
            await this.updateValueProposition(
                {
                    previous: updatedValueProposition,
                    updated: updated.find((candidate) => candidate.id === updatedValueProposition.id)!,
                    entityManager,
                },
            )
        }
    }
}

