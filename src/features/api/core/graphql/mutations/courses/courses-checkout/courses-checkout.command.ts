import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CoursesCheckoutRequest,
} from "./graphql-types/request"

/**
 * CQRS command carrying the multi-course checkout request + auth context.
 */
export class CoursesCheckoutCommand {
    constructor(
        readonly params: ExecuteParams<CoursesCheckoutRequest>,
    ) { }
}
