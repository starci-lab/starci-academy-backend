import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CourseEnrollmentStatusRequest,
} from "./graphql-types/request"

/** CQRS message that checks whether the caller is enrolled in a course. */
export class CourseEnrollmentStatusQuery {
    constructor(
        readonly params: ExecuteParams<CourseEnrollmentStatusRequest>,
    ) {}
}
