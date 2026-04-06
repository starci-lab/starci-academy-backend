import {
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionPromptTranslationEntity,
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
    challengeSubmissionPromptTranslationKey,
    sanitizePrimitiveFields,
} from "../utils"
import _ from "lodash"

@Injectable()
export class ChallengeSubmissionPromptUpdaterService {
    async updateTranslation(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeSubmissionPromptTranslationEntity>,
    ) {
        await entityManager.update(
            ChallengeSubmissionPromptTranslationEntity,
            {
                challengeSubmissionPromptId: previous.challengeSubmissionPromptId,
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
        }: UpdateParams<Array<ChallengeSubmissionPromptTranslationEntity>>,
    ) {
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            challengeSubmissionPromptTranslationKey,
        )
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            challengeSubmissionPromptTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            challengeSubmissionPromptTranslationKey,
        )
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                ChallengeSubmissionPromptTranslationEntity,
                {
                    challengeSubmissionPromptId: translation.challengeSubmissionPromptId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        await entityManager.save(
            ChallengeSubmissionPromptTranslationEntity,
            createdTranslations,
        )
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => challengeSubmissionPromptTranslationKey(candidate) === challengeSubmissionPromptTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    async updateChallengeSubmissionPrompt(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeSubmissionPromptEntity>,
    ) {
        await entityManager.update(
            ChallengeSubmissionPromptEntity,
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

    async updateChallengeSubmissionPrompts(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ChallengeSubmissionPromptEntity>>,
    ) {
        const deleted = _.differenceBy(
            previous,
            updated,
            "id",
        )
        const created = _.differenceBy(
            updated,
            previous,
            "id",
        )
        const toUpdate = _.intersectionBy(
            previous,
            updated,
            "id",
        )
        await entityManager.delete(
            ChallengeSubmissionPromptEntity,
            {
                id: In(deleted.map((row) => row.id)),
            },
        )
        await entityManager.save(
            ChallengeSubmissionPromptEntity,
            created,
        )
        for (const prevRow of toUpdate) {
            await this.updateChallengeSubmissionPrompt(
                {
                    previous: prevRow,
                    updated: updated.find((candidate) => candidate.id === prevRow.id)!,
                    entityManager,
                },
            )
        }
    }
}
