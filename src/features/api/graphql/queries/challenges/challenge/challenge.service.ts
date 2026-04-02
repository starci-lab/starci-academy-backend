import {
    ChallengeEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
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
import type {
    EntityManager,
} from "typeorm"
import type {
    ChallengeRequest,
} from "./graphql-types"
import type {
    ExecuteParams,
} from "../../../../types"

@Injectable()
export class ChallengeQueryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeTransformer: ChallengeTransformerService,
    ) {}

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
                    inputs: {
                        translations: true,
                    },
                    steps: {
                        translations: true,
                    },
                    references: {
                        translations: true,
                    },
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
        const moduleFallbackLocale = challenge.defaultLocale ?? Locale.En
        this.challengeTransformer.transform(
            challenge,
            locale,
            moduleFallbackLocale,
        )
        return challenge
    }
}
