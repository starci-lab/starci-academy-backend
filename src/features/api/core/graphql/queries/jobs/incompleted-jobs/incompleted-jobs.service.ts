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
    IncompletedJobsQuery,
} from "./incompleted-jobs.query"
import {
    IncompletedJobsResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin wiring layer for the `incompletedJobs` resolver: dispatches to
 * {@link IncompletedJobsQuery} on the query bus. The actual logic lives in
 * {@link IncompletedJobsHandler}.
 */
export class IncompletedJobsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<undefined>,
    ): Promise<IncompletedJobsResponseData> {
        return this.queryBus.execute(
            new IncompletedJobsQuery(params),
        )
    }
}
