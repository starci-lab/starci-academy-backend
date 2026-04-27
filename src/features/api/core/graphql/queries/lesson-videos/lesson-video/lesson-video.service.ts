import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    LessonVideoEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    LessonVideoQuery,
} from "./lesson-video.query"
import {
    LessonVideoRequest,
} from "./graphql-types"

@Injectable()
export class LessonVideoQueryService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<LessonVideoRequest>,
    ): Promise<LessonVideoEntity> {
        return this.queryBus.execute(
            new LessonVideoQuery(params),
        )
    }
}
