import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    MilestoneTaskProgressQuery,
} from "./milestone-task-progress.query"
import {
    MilestoneTaskProgressRequest,
} from "./graphql-types/request"
import {
    MilestoneTaskProgressResponseData,
} from "./graphql-types/response"

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
