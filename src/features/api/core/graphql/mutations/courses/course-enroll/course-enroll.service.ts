import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CourseEnrollCommand,
} from "./course-enroll.command"
import type {
    CourseEnrollRequest,
} from "./graphql-types/request"
import type {
    CourseEnrollResponseData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver does not import gateway services. */
export class CourseEnrollService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<CourseEnrollRequest>,
    ): Promise<CourseEnrollResponseData> {
        return this.commandBus.execute(
            new CourseEnrollCommand(params),
        )
    }
}
