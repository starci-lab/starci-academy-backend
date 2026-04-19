import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/types"
import {
    LessonVideosQuery,
} from "./lesson-videos.query"
import {
    LessonVideosRequest,
    LessonVideosResponseData,
} from "./graphql-types"

@Injectable()
export class LessonVideosService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<LessonVideosRequest>,
    ): Promise<LessonVideosResponseData> {
        return this.queryBus.execute(
            new LessonVideosQuery(params),
        )
    }
}
