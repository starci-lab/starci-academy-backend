import {
    LessonVideoEntity
} from "@modules/databases"
import {
    LessonVideoNotFoundException,
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
    LessonVideoRequest,
} from "./graphql-types"

/**
 * Loads lesson video shell data (no translations — fetch those by id).
 */
@Injectable()
export class LessonVideoQueryService {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    /**
     * Entry: returns one lesson video by primary id.
     *
     * @param request - Wrapper with lesson video id
     * @param request.id - Lesson video id
     * @throws {LessonVideoNotFoundException} When no lesson video exists for `id`.
     */
    async execute(
        {
            request,
            locale,
        }: ExecuteParams<LessonVideoRequest>,
    ): Promise<LessonVideoEntity> {
        const objectKey = this.s3NameResolverService.lessonVideo(request.id, locale)
        const cdnPayload = await this.s3ReadService.json<UploadPayload>({
            key: objectKey,
            provider: S3Provider.Minio,
        }).catch(() => null)

        if (!cdnPayload) {
            throw new LessonVideoNotFoundException(
                {
                    id: request.id,
                },
            )
        }

        const hydratedLessonVideo = this.superJson.parse<LessonVideoEntity>(cdnPayload.data)
        return hydratedLessonVideo
    }
}
