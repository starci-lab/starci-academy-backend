import {
    ChallengeEntity,
    ChallengeReferenceEntity,
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
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/s3"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"

/**
 * Loads a challenge (steps + references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ChallengeResolverService`) for CDN JSON.
 */
@Injectable()
export class CdnChallengeBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeResolver: ChallengeResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed challenge tree.
     */
    async buildMultilingualByChallengeId(
        challengeId: string,
    ): Promise<Array<LocalizedCdnEntity<ChallengeEntity>>> {
        const hydratedChallenge = await this.loadHydratedChallengePlain(
            challengeId,
        )
        const defaultLocale = hydratedChallenge.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                this.challengeResolver.transform(
                    hydratedChallenge,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: hydratedChallenge,
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
        hydratedChallenge.steps = steps.map(
            (
                step,
            ) => step.toPlain<ChallengeStepEntity>()
        )
        hydratedChallenge.references = references.map(
            (
                reference,
            ) => reference.toPlain<ChallengeReferenceEntity>()
        )
        return hydratedChallenge
    }

    /**
     * Materialize and upload the challenges to the CDN.
     * @param challengeId - The challenge id to materialize and upload.
     */
    async materializeAndUpload(
        challengeId: string,
    ): Promise<void> {
        const challenges = await this.buildMultilingualByChallengeId(
            challengeId,
        )
        await this.materializeAndUploadService.process(
            challenges,
            (
                id,
                locale,
            ) => this.s3NameResolverService.challenge(
                id,
                locale,
            ),
        )
    }
}
