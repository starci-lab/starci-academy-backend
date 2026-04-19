import {
    ICqrsHandler,
} from "@modules/bussiness"
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
import SuperJSON from "superjson"
import {
    ChallengeQuery,
} from "./challenge.query"

@Injectable()
export class ChallengeHandler extends ICqrsHandler<ChallengeEntity> {
    constructor(
        private readonly query: ChallengeQuery,
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {
        super()
    }

    protected async process(): Promise<ChallengeEntity> {
        const {
            request,
            locale,
        } = this.query.params

        const objectKey = this.s3NameResolverService.challenge(request.id,
            locale)

        const cdnPayload = await this.s3ReadService.json<UploadPayload>({
            key: objectKey,
            provider: S3Provider.Minio,
        }).catch(() => null)

        if (!cdnPayload) {
            throw new ChallengeNotFoundException(
                {
                    id: request.id,
                },
            )
        }

        return this.superJson.parse<ChallengeEntity>(cdnPayload.data)
    }
}
