import {
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    Locale,
} from "@modules/databases"
import {
    LessonVideoNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    LessonVideoTransformerService,
} from "../../../utils"
import type {
    EntityManager,
} from "typeorm"
import type {
    LessonVideoRequest,
} from "./graphql-types"
import type {
    ExecuteParams,
} from "../../../../types"
import { 
    S3NameResolverService, 
    S3Provider, 
    S3ReadService, 
    UploadPayload} from "@modules/s3"
import { 
    InjectSuperJson 
} from "@modules/mixin"
import SuperJSON from "superjson"

/**
 * Loads lesson video shell data (no translations — fetch those by id).
 */
@Injectable()
export class LessonVideoQueryService {
    constructor(
        private readonly lessonVideoTransformer: LessonVideoTransformerService,
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
        const objectKey = this.s3NameResolverService.lessonVideo(request.id)

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
        this.lessonVideoTransformer.transform(
            hydratedLessonVideo,
            locale,
            hydratedLessonVideo.defaultLocale ?? Locale.En,
        )
        return hydratedLessonVideo
    }
}
