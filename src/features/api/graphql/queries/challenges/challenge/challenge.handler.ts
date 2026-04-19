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
    InjectSuperJson,
} from "@modules/mixin"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
    UploadPayload,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import SuperJSON from "superjson"
import {
    ChallengeQuery,
} from "./challenge.query"

@QueryHandler(ChallengeQuery)
@Injectable()
export class ChallengeHandler
    extends ICQRSHandler<ChallengeQuery, ChallengeEntity>
    implements IQueryHandler<ChallengeQuery, ChallengeEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {
        super()
    }

    protected override async process(query: ChallengeQuery): Promise<ChallengeEntity> {
        const {
            request,
            locale,
        } = query.params

        const objectKey = this.s3NameResolverService.challenge(request.id,
            locale)

        const cdnPayload = await this.s3ReadService.json<UploadPayload>({
            key: objectKey,
            provider: S3Provider.Minio,
        }).catch(() => null)

        if (!cdnPayload) {
            throw new ChallengeNotFoundException({
                id: request.id,
            })
        }

        return this.superJson.parse<ChallengeEntity>(cdnPayload.data)
    }
}
