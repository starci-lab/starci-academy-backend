import {
    ChallengeEntity,
    ChallengeReferenceEntity,
    ChallengeStepEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeTransformerService,
} from "../../../utils"
import {
    type EntityManager,
} from "typeorm"
import type {
    ChallengeRequest,
} from "./graphql-types"
import type {
    ExecuteParams,
} from "../../../../types"
import _ from "lodash"

/**
 * Service for querying challenges.
 */
@Injectable()
export class ChallengeQueryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeTransformer: ChallengeTransformerService,
    ) {}

    /**
     * Entry: returns one challenge by primary id.
     *
     * @param request - Wrapper with challenge id
     * @param request.id - Challenge id
     * @throws {ChallengeNotFoundException} When no challenge exists for `id`.
     */
    async execute(
        {
            request,
            locale,
        }: ExecuteParams<ChallengeRequest>,
    ): Promise<ChallengeEntity> {
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id: request.id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!challenge) {
            throw new ChallengeNotFoundException(
                {
                    id: request.id,
                },
            )
        }
        const hydratedChallenge = _.cloneDeep(challenge)
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
        const hydratedSteps = _.cloneDeep(steps)
        hydratedChallenge.steps = hydratedSteps
        const hydratedReferences = _.cloneDeep(references)
        hydratedChallenge.references = hydratedReferences
        this.challengeTransformer.transform(
            hydratedChallenge,
            locale,
            challenge.defaultLocale,
        )
        return hydratedChallenge
    }
}
