import {
    QnaEntity, 
    QnaTranslationEntity
} from "@modules/databases"
import {
    Injectable 
} from "@nestjs/common"
import {
    In
} from "typeorm"
import type {
    UpdateParams 
} from "./types"
import {
    qnaTranslationKey,
    sanitizePrimitiveFields,
} from "./utils"
import _ from "lodash"

/**
 * The service for the Q&A.
 */
@Injectable()
export class QnaService {
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
        }: UpdateParams<QnaTranslationEntity>
    ) {
        // we update the translation
        await entityManager.update(
            QnaTranslationEntity,
            {
                qnaId: previous.qnaId,
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
        }: UpdateParams<Array<QnaTranslationEntity>>
    ) {
        // we get the deleted translations
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            qnaTranslationKey,
        )
        // we get the new translations
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            qnaTranslationKey,
        )
        // we get the updated translations
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            qnaTranslationKey,
        )
        // we delete the deleted translations
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                QnaTranslationEntity,
                {
                    qnaId: translation.qnaId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }

        // we save the new translations
        await entityManager.save(
            QnaTranslationEntity,
            createdTranslations
        )
        // we update the updated translations
        for (const translation of updatedTranslations) {
            await this.updateTranslation({
                previous: translation,
                updated: updated.find(
                    (candidate) => qnaTranslationKey(candidate) === qnaTranslationKey(translation),
                )!,
                entityManager,
            })
        }
    }

    /**
     * Update the Q&A.
     * @param params - The parameters for updating the Q&A.
     * @param params.previous - The previous Q&A.
     * @param params.updated - The updated Q&A.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateQna(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<QnaEntity>
    ) {
        // we update the Q&A
        await entityManager.update(
            QnaEntity,
            {
                id: previous.id,
            },
            sanitizePrimitiveFields(updated),
        )
        // we update the translations
        await this.updateTranslations({
            previous: previous.translations,
            updated: updated.translations,
            entityManager,
        })
    }

    /**
     * Update the Q&As.
     * @param params - The parameters for updating the Q&As.
     * @param params.previous - The previous Q&As.
     * @param params.updated - The updated Q&As.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateQnas(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<QnaEntity>>
    ) {
        // we get the deleted Q&As
        const deletedQnas = _.differenceBy(
            previous,
            updated,
            "id"
        )
        // we get the new Q&As
        const createdQnas = _.differenceBy(
            updated,
            previous,
            "id"
        )
        // we get the updated Q&As
        const updatedQnas = _.intersectionBy(
            previous,
            updated,
            "id"
        )
        // we delete the deleted Q&As
        await entityManager.delete(
            QnaEntity,
            {
                id: In(deletedQnas.map(qna => qna.id))
            }
        )
        // we save the new Q&As
        await entityManager.save(
            QnaEntity,  
            createdQnas
        )
        // we update the updated Q&As
        for (const qna of updatedQnas) {
            await this.updateQna({
                previous: qna,
                updated: updated.find(
                    updatedQna => updatedQna.id === qna.id
                )!,
                entityManager,
            })
        }
    }
}