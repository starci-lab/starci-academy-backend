import {
    ChallengeReferenceEntity,
    ChallengeReferenceTranslationEntity,
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
    challengeReferenceTranslationKey,
    sanitizePrimitiveFields,
} from "./utils"
import _ from "lodash"

@Injectable()
export class ChallengeReferenceService {
    async updateTranslation(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeReferenceTranslationEntity>
    ) {
        await entityManager.update(
            ChallengeReferenceTranslationEntity,
            {
                challengeReferenceId: previous.challengeReferenceId,
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
        }: UpdateParams<Array<ChallengeReferenceTranslationEntity>>
    ) {
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            challengeReferenceTranslationKey,
        )
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            challengeReferenceTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            challengeReferenceTranslationKey,
        )
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                ChallengeReferenceTranslationEntity,
                {
                    challengeReferenceId: translation.challengeReferenceId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        await entityManager.save(
            ChallengeReferenceTranslationEntity,
            createdTranslations,
        )
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => challengeReferenceTranslationKey(candidate) === challengeReferenceTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    async updateChallengeReference(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeReferenceEntity>,
    ) {
        await entityManager.update(
            ChallengeReferenceEntity,
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

    async updateChallengeReferences(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ChallengeReferenceEntity>>,
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
            ChallengeReferenceEntity,
            {
                id: In(deletedReferences.map((r) => r.id)),
            },
        )
        await entityManager.save(
            ChallengeReferenceEntity,
            createdReferences,
        )
        for (const previousRef of updatedReferences) {
            await this.updateChallengeReference(
                {
                    previous: previousRef,
                    updated: updated.find((candidate) => candidate.id === previousRef.id)!,
                    entityManager,
                },
            )
        }
    }
}
