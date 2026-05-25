import {
    ContentEntity,
    ContentHydrationService,
    ContentResolverService,
    Locale,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/s3"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"
import _ from "lodash"

/**
 * Loads content (with references, code explainings, implementations) from PostgreSQL and
 * materializes **per-locale** plain objects (after `ContentResolverService`) for CDN JSON.
 */
@Injectable()
export class CdnContentBuildService {
    constructor(
        private readonly contentHydration: ContentHydrationService,
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
        const hydratedContent = await this.contentHydration.loadById(
            contentId,
        )
        const defaultLocale = hydratedContent.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedContent = _.cloneDeep(hydratedContent)
                this.contentResolver.transform(
                    localizedContent,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: localizedContent,
                }
            },
        )
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
