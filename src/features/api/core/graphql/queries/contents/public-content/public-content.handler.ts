import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
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
    PublicContentQuery,
} from "./public-content.query"
import {
    EntityManager 
} from "typeorm"

@QueryHandler(PublicContentQuery)
@Injectable()
export class PublicContentHandler
    extends ICQRSHandler<PublicContentQuery, ContentEntity>
    implements IQueryHandler<PublicContentQuery, ContentEntity> {
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
        query: PublicContentQuery
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
                        isPremium: true,
                    },
                })
            if (!content) {
                throw new ContentNotFoundException({
                    id: request.id,
                })
            }
            // Block access to premium content via public endpoint
            if (content.isPremium) {
                throw new ContentNotFoundException({
                    id: request.id,
                })
            }
            id = content.id
        } else {
            // Verify the content is non-premium
            const content = await this.entityManager.findOne(
                ContentEntity,
                {
                    where: { id },
                    select: { isPremium: true },
                },
            )
            if (!content || content.isPremium) {
                throw new ContentNotFoundException({ id })
            }
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
