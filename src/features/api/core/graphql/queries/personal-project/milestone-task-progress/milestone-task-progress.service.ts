import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MilestoneTaskProgressQuery,
} from "./milestone-task-progress.query"
import {
    MilestoneTaskProgressRequest,
    MilestoneTaskProgressResponseData,
} from "./graphql-types"

@Injectable()
export class MilestoneTaskProgressService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<MilestoneTaskProgressRequest>,
    ): Promise<MilestoneTaskProgressResponseData> {
        return this.queryBus.execute(
            new MilestoneTaskProgressQuery(params),
        )
    }
}
