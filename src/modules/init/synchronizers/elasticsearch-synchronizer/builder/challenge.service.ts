import {
    ChallengeEntity,
    ChallengeOutputEntity,
    ChallengePrerequisiteEntity,
    ChallengeReferenceEntity,
    ChallengeRequirementEntity,
    ChallengeResolverService,
    ChallengeStepEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

/**
 * Loads a challenge (steps + references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ChallengeResolverService`) for Elasticsearch JSON.
 */
@Injectable()
export class ElasticsearchChallengeBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeResolver: ChallengeResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed challenge tree.
     */
    async buildMultilingualByChallengeId(
        challengeId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<ChallengeEntity>>> {
        const hydratedChallenge = await this.loadHydratedChallengePlain(
            challengeId,
        )
        const defaultLocale = hydratedChallenge.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedChallenge = _.cloneDeep(hydratedChallenge)
                this.challengeResolver.transform(
                    localizedChallenge,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: localizedChallenge,
                }
            },
        )
    }

    /**
     * Loads the hydrated challenge plain object from PostgreSQL.
     * @param id - The challenge id.
     * @returns The hydrated challenge plain object.
     */
    private async loadHydratedChallengePlain(
        id: string,
    ): Promise<ChallengeEntity> {
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!challenge) {
            throw new ChallengeNotFoundException(
                {
                    id,
                }
            )
        }
        const hydratedChallenge = challenge.toPlain<ChallengeEntity>()
        // load steps
        const steps = await this.entityManager.find(
            ChallengeStepEntity,
            {
                where: {
                    challenge: {
                        id: hydratedChallenge.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const hydratedSteps = steps.map(
            (
                step,
            ) => step.toPlain<ChallengeStepEntity>()
        )
        hydratedChallenge.steps = hydratedSteps
        // load references
        const references = await this.entityManager.find(
            ChallengeReferenceEntity,
            {
                where: {
                    challenge: {
                        id: hydratedChallenge.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const hydratedReferences = references.map(
            (
                reference,
            ) => reference.toPlain<ChallengeReferenceEntity>()
        )
        hydratedChallenge.references = hydratedReferences
        // load requirements
        const requirements = await this.entityManager.find(
            ChallengeRequirementEntity,
            {
                where: {
                    challenge: {
                        id: hydratedChallenge.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const hydratedRequirements = requirements.map(
            (
                requirement,
            ) => requirement.toPlain<ChallengeRequirementEntity>()
        )
        hydratedChallenge.requirements = hydratedRequirements
        // load outputs
        const outputs = await this.entityManager.find(
            ChallengeOutputEntity,
            {
                where: {
                    challenge: {
                        id: hydratedChallenge.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const hydratedOutputs = outputs.map(
            (
                output,
            ) => output.toPlain<ChallengeOutputEntity>()
        )
        hydratedChallenge.outputs = hydratedOutputs
        // load prerequisites
        const prerequisites = await this.entityManager.find(
            ChallengePrerequisiteEntity,
            {
                where: {
                    challenge: {
                        id: hydratedChallenge.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        const hydratedPrerequisites = prerequisites.map(
            (
                prerequisite,
            ) => prerequisite.toPlain<ChallengePrerequisiteEntity>()
        )
        hydratedChallenge.prerequisites = hydratedPrerequisites
        // return hydrated challenge
        return hydratedChallenge
    }

    /**
     * Builds the index by challenge id.
     * @param id - The challenge id.
     * @returns The index by challenge id.
     */
    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByChallengeId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: ChallengeEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
