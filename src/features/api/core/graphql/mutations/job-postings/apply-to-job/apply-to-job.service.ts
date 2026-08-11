import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import type {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    ApplyToJobRequest,
} from "./graphql-types/request"
import {
    ApplyToJobCommand,
} from "./apply-to-job.command"

@Injectable()
/** Dispatches an internal application to the command handler. */
export class ApplyToJobService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(params: ExecuteParams<ApplyToJobRequest>): Promise<JobApplicationEntity> {
        return this.commandBus.execute(new ApplyToJobCommand(params))
    }
}
