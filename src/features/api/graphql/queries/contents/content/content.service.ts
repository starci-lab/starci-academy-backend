import {
    ContentEntity,
    Locale
} from "@modules/databases"
import {
    ContentNotFoundException,
} from "@modules/exceptions"
import {
    InjectSuperJson
} from "@modules/mixin"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
    UploadPayload
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import SuperJSON from "superjson"
import type {
    ExecuteParams,
} from "../../../../types"
import type {
    ContentRequest,
} from "./graphql-types"

/**
 * Service for querying content.
 */
@Injectable()
export class ContentQueryService {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    /**
     * Entry: returns one content by primary id.
     *
     * @param request - Wrapper with content id
     * @param request.id - Content id
     * @throws {ContentNotFoundException} When no content exists for `id`.
     */
    async execute(
        {
            request,
            locale,
        }: ExecuteParams<ContentRequest>,
    ): Promise<ContentEntity> {
        const objectKey = this.s3NameResolverService.content(request.id, locale)
        const cdnPayload = await this.s3ReadService.json<UploadPayload>({
            key: objectKey,
            provider: S3Provider.Minio,
        }).catch(() => null)

        if (!cdnPayload) {
            throw new ContentNotFoundException(
                {
                    id: request.id,
                },
            );
        }

        const hydratedContent = this.superJson.parse<ContentEntity>(cdnPayload.data)
        return hydratedContent
    }
}
