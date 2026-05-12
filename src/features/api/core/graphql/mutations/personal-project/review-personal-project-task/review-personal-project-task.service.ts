import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ReviewPersonalProjectTaskCommand,
} from "./review-personal-project-task.command"
import type {
    ReviewPersonalProjectTaskRequest,
    ReviewPersonalProjectTaskResponseData,
} from "./graphql-types"

@Injectable()
export class ReviewPersonalProjectTaskService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<ReviewPersonalProjectTaskRequest>,
    ): Promise<ReviewPersonalProjectTaskResponseData> {
        return this.commandBus.execute(
            new ReviewPersonalProjectTaskCommand(params),
        )
    }
}
