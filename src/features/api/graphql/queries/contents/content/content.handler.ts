import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ContentEntity,
} from "@modules/databases"
import {
    ContentNotFoundException,
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
    ContentQuery,
} from "./content.query"

@QueryHandler(ContentQuery)
@Injectable()
export class ContentHandler
    extends ICQRSHandler<ContentQuery, ContentEntity>
    implements IQueryHandler<ContentQuery, ContentEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {
        super()
    }

    protected override async process(query: ContentQuery): Promise<ContentEntity> {
        const {
            request,
            locale,
        } = query.params

        const objectKey = this.s3NameResolverService.content(
            request.id,
            locale
        )
        const cdnPayload = await this.s3ReadService.json<UploadPayload>({
            key: objectKey,
            provider: S3Provider.Minio,
        })

        if (!cdnPayload) {
            throw new ContentNotFoundException({
                id: request.id,
            })
        }

        return this.superJson.parse<ContentEntity>(cdnPayload.data)
    }
}
