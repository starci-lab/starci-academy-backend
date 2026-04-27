import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CourseRequest,
} from "./graphql-types"

export class CourseQuery {
    constructor(
        readonly params: ExecuteParams<CourseRequest>,
    ) {}
}
