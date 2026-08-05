import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CourseRequest,
} from "./graphql-types"

/** CQRS message that loads one course by id / display id. */
export class CourseQuery {
    constructor(
        readonly params: ExecuteParams<CourseRequest>,
    ) {}
}
