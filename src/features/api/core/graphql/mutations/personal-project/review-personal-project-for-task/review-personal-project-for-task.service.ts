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
    ReviewPersonalProjectForTaskCommand,
} from "./review-personal-project-for-task.command"
import type {
    ReviewPersonalProjectForTaskRequest,
    ReviewPersonalProjectForTaskResponseData,
} from "./graphql-types"

@Injectable()
export class ReviewPersonalProjectForTaskService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<ReviewPersonalProjectForTaskRequest>,
    ): Promise<ReviewPersonalProjectForTaskResponseData> {
        return this.commandBus.execute(
            new ReviewPersonalProjectForTaskCommand(params),
        )
    }
}
