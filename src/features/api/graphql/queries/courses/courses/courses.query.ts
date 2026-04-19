import {
    ExecuteParams,
} from "@features/api/types"
import {
    CoursesRequest,
} from "./graphql-types"

export class CoursesQuery {
    constructor(
        readonly params: ExecuteParams<CoursesRequest>,
    ) {}
}
