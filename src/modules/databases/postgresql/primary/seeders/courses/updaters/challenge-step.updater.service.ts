import {
    ChallengeStepEntity,
    ChallengeStepTranslationEntity,
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
    challengeStepTranslationKey,
    sanitizePrimitiveFields,
} from "../utils"
import _ from "lodash"

@Injectable()
export class ChallengeStepUpdaterService {
    async updateTranslation(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeStepTranslationEntity>
    ) {
        await entityManager.update(
            ChallengeStepTranslationEntity,
            {
                challengeStepId: previous.challengeStepId,
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
        }: UpdateParams<Array<ChallengeStepTranslationEntity>>
    ) {
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            challengeStepTranslationKey,
        )
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            challengeStepTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            challengeStepTranslationKey,
        )
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                ChallengeStepTranslationEntity,
                {
                    challengeStepId: translation.challengeStepId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        await entityManager.save(
            ChallengeStepTranslationEntity,
            createdTranslations,
        )
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => challengeStepTranslationKey(candidate) === challengeStepTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    async updateChallengeStep(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeStepEntity>,
    ) {
        await entityManager.update(
            ChallengeStepEntity,
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

    async updateChallengeSteps(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ChallengeStepEntity>>,
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
            ChallengeStepEntity,
            {
                id: In(deleted.map((row) => row.id)),
            },
        )
        await entityManager.save(
            ChallengeStepEntity,
            created,
        )
        for (const prevRow of toUpdate) {
            await this.updateChallengeStep(
                {
                    previous: prevRow,
                    updated: updated.find((candidate) => candidate.id === prevRow.id)!,
                    entityManager,
                },
            )
        }
    }
}
