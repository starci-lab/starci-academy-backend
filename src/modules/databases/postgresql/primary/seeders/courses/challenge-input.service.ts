import {
    ChallengeInputEntity,
    ChallengeInputTranslationEntity,
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
    challengeInputTranslationKey,
    sanitizePrimitiveFields,
} from "./utils"
import _ from "lodash"

@Injectable()
export class ChallengeInputService {
    async updateTranslation(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeInputTranslationEntity>
    ) {
        await entityManager.update(
            ChallengeInputTranslationEntity,
            {
                challengeInputId: previous.challengeInputId,
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
        }: UpdateParams<Array<ChallengeInputTranslationEntity>>
    ) {
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            challengeInputTranslationKey,
        )
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            challengeInputTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            challengeInputTranslationKey,
        )
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                ChallengeInputTranslationEntity,
                {
                    challengeInputId: translation.challengeInputId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        await entityManager.save(
            ChallengeInputTranslationEntity,
            createdTranslations,
        )
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => challengeInputTranslationKey(candidate) === challengeInputTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    async updateChallengeInput(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeInputEntity>,
    ) {
        await entityManager.update(
            ChallengeInputEntity,
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

    async updateChallengeInputs(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ChallengeInputEntity>>,
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
            ChallengeInputEntity,
            {
                id: In(deleted.map((row) => row.id)),
            },
        )
        await entityManager.save(
            ChallengeInputEntity,
            created,
        )
        for (const prevRow of toUpdate) {
            await this.updateChallengeInput(
                {
                    previous: prevRow,
                    updated: updated.find((candidate) => candidate.id === prevRow.id)!,
                    entityManager,
                },
            )
        }
    }
}
