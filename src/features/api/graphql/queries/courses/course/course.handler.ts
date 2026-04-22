import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    CourseEntity,
} from "@modules/databases"
import {
    CourseNotFoundException,
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
    CourseQuery,
} from "./course.query"

@QueryHandler(CourseQuery)
@Injectable()
export class CourseHandler
    extends ICQRSHandler<CourseQuery, CourseEntity>
    implements IQueryHandler<CourseQuery, CourseEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {
        super()
    }

    protected override async process(query: CourseQuery): Promise<CourseEntity> {
        const {
            request,
            locale,
        } = query.params

        if (!request.displayId) {
            throw new CourseNotFoundException({
                id: request.id,
            })
        }

        const objectKey = this.s3NameResolverService.course(request.displayId,
            locale)
        const cdnPayload = await this.s3ReadService.json<UploadPayload>({
            key: objectKey,
            provider: S3Provider.Minio,
        }).catch(() => null)

        if (!cdnPayload) {
            throw new CourseNotFoundException({
                id: request.id,
            })
        }

        return this.superJson.parse<CourseEntity>(cdnPayload.data)
    }
}
