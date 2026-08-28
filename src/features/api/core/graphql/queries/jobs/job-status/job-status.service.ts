import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import {
    JobStatusQuery,
} from "./job-status.query"
import type {
    JobStatusRequest,
} from "./graphql-types/request"
import type {
    JobStatusResponseData,
} from "./graphql-types/response"

@Injectable()
/** Dispatches the public job-status request through CQRS. */
export class JobStatusService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<JobStatusRequest>,
    ): Promise<JobStatusResponseData> {
        return this.queryBus.execute(
            new JobStatusQuery(params),
        )
    }
}
