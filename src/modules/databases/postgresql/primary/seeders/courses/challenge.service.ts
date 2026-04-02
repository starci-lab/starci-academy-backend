import {
    ChallengeEntity,
    ChallengeTranslationEntity,
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
    challengeTranslationKey,
    sanitizePrimitiveFields,
} from "./utils"
import _ from "lodash"
import {
    ChallengeInputService,
} from "./challenge-input.service"
import {
    ChallengeReferenceService,
} from "./challenge-reference.service"
import {
    ChallengeStepService,
} from "./challenge-step.service"

@Injectable()
export class ChallengeService {
    constructor(
        private readonly challengeInputService: ChallengeInputService,
        private readonly challengeStepService: ChallengeStepService,
        private readonly challengeReferenceService: ChallengeReferenceService,
    ) {}

    async updateTranslation(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeTranslationEntity>
    ) {
        await entityManager.update(
            ChallengeTranslationEntity,
            {
                challengeId: previous.challengeId,
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
        }: UpdateParams<Array<ChallengeTranslationEntity>>
    ) {
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            challengeTranslationKey,
        )
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            challengeTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            challengeTranslationKey,
        )
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                ChallengeTranslationEntity,
                {
                    challengeId: translation.challengeId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        await entityManager.save(
            ChallengeTranslationEntity,
            createdTranslations,
        )
        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => challengeTranslationKey(candidate) === challengeTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    async updateChallenge(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengeEntity>,
    ) {
        await entityManager.update(
            ChallengeEntity,
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
        await this.challengeInputService.updateChallengeInputs(
            {
                previous: previous.inputs ?? [],
                updated: updated.inputs ?? [],
                entityManager,
            },
        )
        await this.challengeStepService.updateChallengeSteps(
            {
                previous: previous.steps ?? [],
                updated: updated.steps ?? [],
                entityManager,
            },
        )
        await this.challengeReferenceService.updateChallengeReferences(
            {
                previous: previous.references ?? [],
                updated: updated.references ?? [],
                entityManager,
            },
        )
    }

    async updateChallenges(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ChallengeEntity>>,
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
            ChallengeEntity,
            {
                id: In(deleted.map((row) => row.id)),
            },
        )
        await entityManager.save(
            ChallengeEntity,
            created,
        )
        for (const prevRow of toUpdate) {
            await this.updateChallenge(
                {
                    previous: prevRow,
                    updated: updated.find((candidate) => candidate.id === prevRow.id)!,
                    entityManager,
                },
            )
        }
    }
}
