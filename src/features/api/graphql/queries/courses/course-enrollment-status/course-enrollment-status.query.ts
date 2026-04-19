import {
    ExecuteParams,
} from "@features/api/types"
import {
    CourseEnrollmentStatusRequest,
} from "./graphql-types"

export class CourseEnrollmentStatusQuery {
    constructor(
        readonly params: ExecuteParams<CourseEnrollmentStatusRequest>,
    ) {}
}
