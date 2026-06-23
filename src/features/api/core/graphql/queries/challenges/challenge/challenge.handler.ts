import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    ChallengeEntity,
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
    ChallengePremiumLockedException,
} from "@modules/exceptions"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    ChallengeQuery,
} from "./challenge.query"

/**
 * Handler for the challenge query.
 */
@QueryHandler(ChallengeQuery)
@Injectable()
export class ChallengeHandler
    extends ICQRSHandler<ChallengeQuery, ChallengeEntity>
    implements IQueryHandler<ChallengeQuery, ChallengeEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Process the challenge query.
     * @param query - Challenge query.
     * @returns Promise of ChallengeEntity.
     */
    protected override async process(query: ChallengeQuery): Promise<ChallengeEntity> {
        const {
            request,
            locale,
        } = query.params

        const objectKey = this.s3NameResolverService.challenge(
            request.id,
            locale
        )
        const challenge = await this.s3ReadService.json<ChallengeEntity>({
            key: objectKey,
            provider: S3Provider.Minio,
        }).catch(() => null)
        if (!challenge) {
            throw new ChallengeNotFoundException({
                id: request.id,
            })
        }
        // challenges are readable ONLY inside FREE (non-premium) content — a premium
        // content's challenge requires enrolling first (mirrors the submit gate).
        const ownerContent = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    challenges: {
                        id: request.id,
                    },
                },
                select: {
                    id: true,
                    isPremium: true,
                },
            },
        )
        if (ownerContent?.isPremium) {
            throw new ChallengePremiumLockedException({
                contentId: ownerContent.id,
            })
        }
        return challenge
    }
}
