import {
    ExecuteParams,
} from "@features/api/types"
import {
    CourseEnrollRequest,
} from "./graphql-types"

export class CourseEnrollCommand {
    constructor(
        readonly params: ExecuteParams<CourseEnrollRequest>,
    ) {}
}
