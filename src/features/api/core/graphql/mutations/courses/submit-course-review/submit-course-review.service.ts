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
    CourseReviewEntity,
} from "@modules/databases/postgresql/primary/entities/course-review.entity"
import {
    SubmitCourseReviewCommand,
} from "./submit-course-review.command"
import type {
    SubmitCourseReviewRequest,
} from "./graphql-types/request"

@Injectable()
/** Thin service that forwards the submitCourseReview request to the CQRS command bus. */
export class SubmitCourseReviewService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatches the submitCourseReview command and returns the written review.
     *
     * @param params - Request/user/locale context for the mutation.
     * @returns The review row that was created.
     */
    async execute(
        params: ExecuteParams<SubmitCourseReviewRequest>,
    ): Promise<CourseReviewEntity> {
        // hand off to the command handler which owns the gates and the write
        return this.commandBus.execute(
            new SubmitCourseReviewCommand(params),
        )
    }
}
