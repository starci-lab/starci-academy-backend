import {
    ExecuteParams,
} from "../../../../types"
import {
    CourseEnrollRequest,
} from "./graphql-types"

/** CQRS envelope for single-course checkout so gateway branching stays in the handler. */
export class CourseEnrollCommand {
    constructor(
        readonly params: ExecuteParams<CourseEnrollRequest>,
    ) { }
}
