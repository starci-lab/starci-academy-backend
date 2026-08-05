import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CourseEnrollRequest,
} from "./graphql-types/request"

/** CQRS envelope for single-course checkout so gateway branching stays in the handler. */
export class CourseEnrollCommand {
    constructor(
        readonly params: ExecuteParams<CourseEnrollRequest>,
    ) { }
}
