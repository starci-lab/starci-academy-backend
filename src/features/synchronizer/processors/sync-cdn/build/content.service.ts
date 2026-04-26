import {
    ContentEntity,
    ContentReferenceEntity,
    ContentResolverService,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    ContentNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/s3"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"

/**
 * Loads content (with references) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ContentResolverService`) for CDN JSON.
 */
@Injectable()
export class CdnContentBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly contentResolver: ContentResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed content tree.
     */
    async buildMultilingualByContentId(
        contentId: string,
    ): Promise<Array<LocalizedCdnEntity<ContentEntity>>> {
        const hydratedContent = await this.loadHydratedContentPlain(
            contentId,
        )
        const defaultLocale = hydratedContent.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                this.contentResolver.transform(
                    hydratedContent,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: hydratedContent,
                }
            },
        )
    }

    /**
     * Loads the hydrated content plain object from PostgreSQL.
     * @param id - The content id.
     * @returns The hydrated content plain object.
     */
    private async loadHydratedContentPlain(
        id: string,
    ): Promise<ContentEntity> {
        const content = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!content) {
            throw new ContentNotFoundException(
                {
                    id,
                }
            )
        }
        const hydratedContent = content.toPlain<ContentEntity>()
        const references = await this.entityManager.find(
            ContentReferenceEntity,
            {
                where: {
                    content: {
                        id: hydratedContent.id,
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
        hydratedContent.references = references.map(
            (
                reference,
            ) => reference.toPlain<ContentReferenceEntity>()
        )
        return hydratedContent
    }

    /**
     * Materialize and upload the contents to the CDN.
     * @param contentId - The content id to materialize and upload.
     */
    async materializeAndUpload(
        contentId: string,
    ): Promise<void> {
        const contents = await this.buildMultilingualByContentId(
            contentId,  
        )
        await this.materializeAndUploadService.process(
            contents,
            (
                id,
                locale,
            ) => this.s3NameResolverService.content(
                id,
                locale,
            ),
        )
    }
}
