import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import type {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import {
    JobApplicationsQuery,
    type JobApplicationsRequest,
} from "./job-applications.query"

@Injectable()
/** Dispatches the employer applicant-list query. */
export class JobApplicationsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(params: ExecuteParams<JobApplicationsRequest>): Promise<Array<JobApplicationEntity>> {
        return this.queryBus.execute(new JobApplicationsQuery(params))
    }
}
