import {
    ExecuteParams,
} from "@features/api/types"
import {
    CourseRequest,
} from "./graphql-types"

export class CourseQuery {
    constructor(
        readonly params: ExecuteParams<CourseRequest>,
    ) {}
}
