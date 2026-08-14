import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    DeleteCourseReviewResponseData,
} from "./graphql-types/response"
import {
    DeleteCourseReviewCommand,
} from "./delete-course-review.command"
import type {
    DeleteCourseReviewRequest,
} from "./graphql-types/request"

@Injectable()
/** Thin service that forwards the deleteCourseReview request to the CQRS command bus. */
export class DeleteCourseReviewService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatches the deleteCourseReview command and returns what it removed.
     *
     * @param params - Request/user/locale context for the mutation.
     * @returns The removed review id and its course.
     */
    async execute(
        params: ExecuteParams<DeleteCourseReviewRequest>,
    ): Promise<DeleteCourseReviewResponseData> {
        // hand off to the command handler which owns the ownership gate and the removal
        return this.commandBus.execute(
            new DeleteCourseReviewCommand(params),
        )
    }
}
