import {
    ChallengeSubmissionEntity,
    ChallengeSubmissionTranslationEntity,
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
    challengeSubmissionTranslationKey,
    sanitizePrimitiveFields,
} from "./utils"
import _ from "lodash"

@Injectable()
export class ChallengeSubmissionService {
    async updateTranslation(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeSubmissionTranslationEntity>
    ) {
        await entityManager.update(
            ChallengeSubmissionTranslationEntity,
            {
                challengeSubmissionId: previous.challengeSubmissionId,
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
        }: UpdateParams<Array<ChallengeSubmissionTranslationEntity>>
    ) {
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            challengeSubmissionTranslationKey,
        )
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            challengeSubmissionTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            challengeSubmissionTranslationKey,
        )
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                ChallengeSubmissionTranslationEntity,
                {
                    challengeSubmissionId: translation.challengeSubmissionId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        await entityManager.save(
            ChallengeSubmissionTranslationEntity,
            createdTranslations,
        )
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => challengeSubmissionTranslationKey(candidate) === challengeSubmissionTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    async updateChallengeSubmission(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeSubmissionEntity>,
    ) {
        await entityManager.update(
            ChallengeSubmissionEntity,
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

    async updateChallengeSubmissions(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ChallengeSubmissionEntity>>,
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
            ChallengeSubmissionEntity,
            {
                id: In(deleted.map((row) => row.id)),
            },
        )
        await entityManager.save(
            ChallengeSubmissionEntity,
            created,
        )
        for (const prevRow of toUpdate) {
            await this.updateChallengeSubmission(
                {
                    previous: prevRow,
                    updated: updated.find((candidate) => candidate.id === prevRow.id)!,
                    entityManager,
                },
            )
        }
    }
}
