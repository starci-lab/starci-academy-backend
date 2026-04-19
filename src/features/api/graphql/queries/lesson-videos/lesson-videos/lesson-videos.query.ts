import {
    ExecuteParams,
} from "@features/api/types"
import {
    LessonVideosRequest,
} from "./graphql-types"

export class LessonVideosQuery {
    constructor(
        readonly params: ExecuteParams<LessonVideosRequest>,
    ) {}
}
