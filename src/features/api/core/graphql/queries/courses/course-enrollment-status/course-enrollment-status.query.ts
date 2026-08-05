import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CourseEnrollmentStatusRequest,
} from "./graphql-types"

/** CQRS message that checks whether the caller is enrolled in a course. */
export class CourseEnrollmentStatusQuery {
    constructor(
        readonly params: ExecuteParams<CourseEnrollmentStatusRequest>,
    ) {}
}
