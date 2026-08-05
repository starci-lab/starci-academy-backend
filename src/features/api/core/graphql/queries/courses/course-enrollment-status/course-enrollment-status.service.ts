import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CourseEnrollmentStatusQuery,
} from "./course-enrollment-status.query"
import type {
    CourseEnrollmentStatusData,
    CourseEnrollmentStatusRequest,
} from "./graphql-types"

@Injectable()
/** Dispatches `CourseEnrollmentStatusQuery` onto the CQRS bus. */
export class CourseEnrollmentStatusService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CourseEnrollmentStatusRequest>,
    ): Promise<CourseEnrollmentStatusData> {
        return this.queryBus.execute(
            new CourseEnrollmentStatusQuery(params),
        )
    }
}
