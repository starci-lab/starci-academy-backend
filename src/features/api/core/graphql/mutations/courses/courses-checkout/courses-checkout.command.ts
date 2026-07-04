import {
    ExecuteParams,
} from "../../../../types"
import {
    CoursesCheckoutRequest,
} from "./graphql-types"

/**
 * CQRS command carrying the multi-course checkout request + auth context.
 */
export class CoursesCheckoutCommand {
    constructor(
        readonly params: ExecuteParams<CoursesCheckoutRequest>,
    ) { }
}
