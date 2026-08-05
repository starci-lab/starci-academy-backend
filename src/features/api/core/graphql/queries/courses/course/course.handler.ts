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
    S3NameResolverService,
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    CourseQuery,
} from "./course.query"

@QueryHandler(CourseQuery)
@Injectable()
/**
 * Loads a single localized course JSON blob from MinIO by display id; throws
 * when the object is missing so the client gets a typed not-found.
 */
export class CourseHandler
    extends ICQRSHandler<CourseQuery, CourseEntity>
    implements IQueryHandler<CourseQuery, CourseEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
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
        const objectKey = this.s3NameResolverService.course(
            request.displayId,
            locale
        )
        const course = await this.s3ReadService.json<CourseEntity>({
            key: objectKey,
            provider: S3Provider.Minio,
        })
        if (!course) {
            throw new CourseNotFoundException(
                {
                    id: request.id,
                }
            )
        }
        return course
    }
}
