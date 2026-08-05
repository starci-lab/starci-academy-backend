import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    Locale,
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    MilestoneNotFoundException,
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
    TaskQuery,
} from "./task.query"

@QueryHandler(TaskQuery)
@Injectable()
/**
 * Loads one milestone task by id from the locale-keyed S3 object (not
 * Postgres). Throws {@link MilestoneNotFoundException} when the object is
 * missing — callers must not treat a null payload as an empty task. Auth
 * and enrolment are enforced upstream by the resolver guards.
 */
export class TaskHandler
    extends ICQRSHandler<TaskQuery, MilestoneTaskEntity>
    implements IQueryHandler<TaskQuery, MilestoneTaskEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
    ) {
        super()
    }

    protected override async process(
        query: TaskQuery,
    ): Promise<MilestoneTaskEntity> {
        const {
            request,
            locale,
        } = query.params

        const objectKey = this.s3NameResolverService.milestoneTask(
            request.id,
            locale || Locale.En,
        )
        const task = await this.s3ReadService.json<MilestoneTaskEntity>({
            key: objectKey,
            provider: S3Provider.Minio,
        })

        if (!task) {
            throw new MilestoneNotFoundException({
                id: request.id,
            })
        }

        return task
    }
}
