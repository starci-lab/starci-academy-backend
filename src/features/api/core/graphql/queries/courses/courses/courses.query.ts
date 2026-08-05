import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CoursesRequest,
} from "./graphql-types/request"

/** CQRS message that lists courses with page-based pagination. */
export class CoursesQuery {
    constructor(
        readonly params: ExecuteParams<CoursesRequest>,
    ) {}
}
