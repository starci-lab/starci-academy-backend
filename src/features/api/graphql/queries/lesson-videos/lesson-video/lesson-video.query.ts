import {
    ExecuteParams,
} from "@features/api/types"
import {
    LessonVideoRequest,
} from "./graphql-types"

export class LessonVideoQuery {
    constructor(
        readonly params: ExecuteParams<LessonVideoRequest>,
    ) {}
}
