import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    ChallengeEntity,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
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
        return challenge
    }
}
