import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CourseEnrollmentStatusRequest,
} from "./graphql-types"

export class CourseEnrollmentStatusQuery {
    constructor(
        readonly params: ExecuteParams<CourseEnrollmentStatusRequest>,
    ) {}
}
