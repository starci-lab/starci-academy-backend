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
    UpdateCourseReviewCommand,
} from "./update-course-review.command"
import type {
    UpdateCourseReviewRequest,
} from "./graphql-types/request"

@Injectable()
/** Thin service that forwards the updateCourseReview request to the CQRS command bus. */
export class UpdateCourseReviewService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatches the updateCourseReview command and returns the edited review.
     *
     * @param params - Request/user/locale context for the mutation.
     * @returns The review row that was created.
     */
    async execute(
        params: ExecuteParams<UpdateCourseReviewRequest>,
    ): Promise<CourseReviewEntity> {
        // hand off to the command handler which owns the ownership gate and the write
        return this.commandBus.execute(
            new UpdateCourseReviewCommand(params),
        )
    }
}
