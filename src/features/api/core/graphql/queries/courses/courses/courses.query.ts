import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CoursesRequest,
} from "./graphql-types"

/** CQRS message that lists courses with page-based pagination. */
export class CoursesQuery {
    constructor(
        readonly params: ExecuteParams<CoursesRequest>,
    ) {}
}
