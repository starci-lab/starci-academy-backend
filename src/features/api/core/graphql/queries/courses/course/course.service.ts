import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CourseQuery,
} from "./course.query"
import {
    CourseRequest,
} from "./graphql-types/request"

@Injectable()
/** Dispatches `CourseQuery` onto the CQRS bus. */
export class CourseService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CourseRequest>,
    ): Promise<CourseEntity> {
        return this.queryBus.execute(
            new CourseQuery(params),
        )
    }
}
