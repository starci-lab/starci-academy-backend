import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ChallengeEntity,
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    ContentContextNotFound,
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
import {
    EntityManager 
} from "typeorm"

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
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: ContentQuery
    ): Promise<ContentEntity> {
        const {
            request,
            locale,
        } = query.params
        if (!request.id && !request.displayId) {
            throw new ContentContextNotFound(
                {
                    displayId: request.displayId,
                    id: request.id,
                }
            )
        }

        let id = request.id
        if (!id) {
            const content = await this.entityManager.findOne(
                ContentEntity,
                {
                    where: {
                        displayId: request.displayId,
                    },
                    select: {
                        id: true,
                    },
                })
            if (!content) {
                throw new ContentNotFoundException({
                    id: request.id,
                })
            }
            id = content.id
        }
        const objectKey = this.s3NameResolverService.content(
            id,
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

        const content = this.superJson.parse<ContentEntity>(cdnPayload.data)

        return content
    }
}
