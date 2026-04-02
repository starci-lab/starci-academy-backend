import {
    ContentReferenceEntity,
    ContentReferenceTranslationEntity,
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
    contentReferenceTranslationKey,
    sanitizePrimitiveFields,
} from "./utils"
import _ from "lodash"

/**
 * Persists content URL references and their translations during seed updates.
 */
@Injectable()
export class ContentReferenceService {
    async updateTranslation(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ContentReferenceTranslationEntity>
    ) {
        await entityManager.update(
            ContentReferenceTranslationEntity,
            {
                contentReferenceId: previous.contentReferenceId,
                locale: previous.locale,
                field: previous.field,
            },
            sanitizePrimitiveFields(updated),
        )
    }

    async updateTranslations(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ContentReferenceTranslationEntity>>
    ) {
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            contentReferenceTranslationKey,
        )
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            contentReferenceTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            contentReferenceTranslationKey,
        )
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                ContentReferenceTranslationEntity,
                {
                    contentReferenceId: translation.contentReferenceId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        await entityManager.save(
            ContentReferenceTranslationEntity,
            createdTranslations,
        )
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => contentReferenceTranslationKey(candidate) === contentReferenceTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    async updateContentReference(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ContentReferenceEntity>,
    ) {
        await entityManager.update(
            ContentReferenceEntity,
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

    async updateContentReferences(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ContentReferenceEntity>>,
    ) {
        const deletedReferences = _.differenceBy(
            previous,
            updated,
            "id",
        )
        const createdReferences = _.differenceBy(
            updated,
            previous,
            "id",
        )
        const updatedReferences = _.intersectionBy(
            previous,
            updated,
            "id",
        )
        await entityManager.delete(
            ContentReferenceEntity,
            {
                id: In(deletedReferences.map((r) => r.id)),
            },
        )
        await entityManager.save(
            ContentReferenceEntity,
            createdReferences,
        )
        for (const previousRef of updatedReferences) {
            await this.updateContentReference(
                {
                    previous: previousRef,
                    updated: updated.find((candidate) => candidate.id === previousRef.id)!,
                    entityManager,
                },
            )
        }
    }
}
