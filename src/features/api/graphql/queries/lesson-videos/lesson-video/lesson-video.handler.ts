import {
    ICQRSHandler,
} from "@modules/bussiness"
import {
    LessonVideoEntity,
} from "@modules/databases"
import {
    LessonVideoNotFoundException,
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
    LessonVideoQuery,
} from "./lesson-video.query"

@QueryHandler(LessonVideoQuery)
@Injectable()
export class LessonVideoHandler
    extends ICQRSHandler<LessonVideoQuery, LessonVideoEntity>
    implements IQueryHandler<LessonVideoQuery, LessonVideoEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {
        super()
    }

    protected override async process(query: LessonVideoQuery): Promise<LessonVideoEntity> {
        const {
            request,
            locale,
        } = query.params

        const objectKey = this.s3NameResolverService.lessonVideo(request.id, locale)
        const cdnPayload = await this.s3ReadService.json<UploadPayload>({
            key: objectKey,
            provider: S3Provider.Minio,
        }).catch(() => null)

        if (!cdnPayload) {
            throw new LessonVideoNotFoundException({
                id: request.id,
            })
        }

        return this.superJson.parse<LessonVideoEntity>(cdnPayload.data)
    }
}
