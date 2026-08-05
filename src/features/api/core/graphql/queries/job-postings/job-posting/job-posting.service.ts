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
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import {
    JobPostingQuery,
} from "./job-posting.query"
import type {
    JobPostingRequestParams,
} from "./types/job-posting-request"

@Injectable()
/**
 * Thin QueryBus facade -- wraps the public display-id lookup in
 * {@link JobPostingQuery}. Logic lives in the matching handler.
 */
export class JobPostingService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<JobPostingRequestParams>,
    ): Promise<JobPostingEntity> {
        return this.queryBus.execute(
            new JobPostingQuery(params),
        )
    }
}
