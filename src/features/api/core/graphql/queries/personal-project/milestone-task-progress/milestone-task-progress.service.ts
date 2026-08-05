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
/**
 * Thin wrapper dispatching {@link MilestoneTaskProgressQuery} onto the CQRS
 * query bus, so the resolver stays free of CQRS wiring.
 */
export class MilestoneTaskProgressService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * @param params - The request DTO plus the authenticated user.
     */
    async execute(
        params: ExecuteParams<MilestoneTaskProgressRequest>,
    ): Promise<MilestoneTaskProgressResponseData> {
        return this.queryBus.execute(
            new MilestoneTaskProgressQuery(params),
        )
    }
}
