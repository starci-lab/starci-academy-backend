import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
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
    CourseQuery,
} from "./course.query"

@QueryHandler(CourseQuery)
@Injectable()
/**
 * Loads a single localized course JSON blob from MinIO by display id OR primary key; throws
 * when neither is supplied or the object is missing, so the client gets a typed not-found.
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

        /*
         * EITHER IDENTIFIER ADDRESSES THE SAME OBJECT, because the synchronizer writes both.
         * `MaterializeAndUploadService` uploads `courses/<entity.id>/<locale>.json` for every
         * entity and `courses/<entity.displayId>/<locale>.json` whenever a display id exists, so a
         * primary key resolves to a real object without a database round trip - which is the whole
         * reason this handler can be a blob read.
         *
         * It used to refuse anything but a display id, on the reading that a key could not be
         * resolved from an id. That reading was wrong about the bucket, and the cost landed on the
         * frontend: the course catalog links by primary key, so every card led to the not-found
         * notice while the object it wanted sat in the bucket under the id it had just been given.
         *
         * DISPLAY ID WINS WHEN BOTH ARRIVE. The two objects are byte-identical today, so the order
         * is about the failure rather than the success: a caller sending both has told us the slug,
         * and reading that one keeps the served object the same as the one a shared link serves.
         */
        const objectId = request.displayId ?? request.id
        if (!objectId) {
            throw new CourseNotFoundException({
                id: request.id,
            })
        }
        const objectKey = this.s3NameResolverService.course(
            objectId,
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
