import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ContentContextNotFound,
} from "@modules/platform/exceptions/errors/courses/content-context-not-found"
import {
    ContentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-not-found"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    PublicContentQuery,
} from "./public-content.query"
import {
    EntityManager 
} from "typeorm"

@QueryHandler(PublicContentQuery)
@Injectable()
/**
 * S3 lesson load for anonymous marketing/SEO; throws ContentNotFoundException
 * for missing OR premium rows so premium ids never leak via this endpoint.
 */
export class PublicContentHandler
    extends ICQRSHandler<PublicContentQuery, ContentEntity>
    implements IQueryHandler<PublicContentQuery, ContentEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
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
                    where: {
                        id 
                    },
                    select: {
                        isPremium: true 
                    },
                },
            )
            if (!content || content.isPremium) {
                throw new ContentNotFoundException({
                    id 
                })
            }
        }

        const objectKey = this.s3NameResolverService.content(
            id,
            locale
        )
        const content = await this.s3ReadService.json<ContentEntity>({
            key: objectKey,
            provider: S3Provider.Minio,
        })

        if (!content) {
            throw new ContentNotFoundException({
                id: request.id,
            })
        }

        return content
    }
}
