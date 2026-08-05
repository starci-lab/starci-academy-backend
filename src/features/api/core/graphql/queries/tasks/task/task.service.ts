import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    TaskQuery,
} from "./task.query"
import {
    TaskRequest,
} from "./graphql-types"

@Injectable()
/**
 * Thin QueryBus facade — wraps resolver params in {@link TaskQuery}. The
 * S3 load and not-found throw live in {@link TaskHandler}.
 */
export class TaskService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<TaskRequest>,
    ): Promise<MilestoneTaskEntity> {
        return this.queryBus.execute(
            new TaskQuery(params),
        )
    }
}
