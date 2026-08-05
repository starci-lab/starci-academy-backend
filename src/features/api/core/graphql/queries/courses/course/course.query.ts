import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CourseRequest,
} from "./graphql-types/request"

/** CQRS message that loads one course by id / display id. */
export class CourseQuery {
    constructor(
        readonly params: ExecuteParams<CourseRequest>,
    ) {}
}
