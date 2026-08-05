import {
    Injectable,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    RequestToTeamHandler,
} from "./request-to-team.handler"
import type {
    RequestToTeamRequest,
} from "./graphql-types/request"
import type {
    RequestToTeamData,
} from "./graphql-types/response"

@Injectable()
/**
 * Invokes the handler directly (no CommandBus) -- this leaf predates the
 * bus hop used elsewhere; do not "fix" it to CommandBus without checking
 * the handler's execute signature.
 */
export class RequestToTeamService {
    constructor(
        private readonly handler: RequestToTeamHandler,
    ) {}

    async execute(
        user: UserEntity,
        request: RequestToTeamRequest,
    ): Promise<RequestToTeamData> {
        return this.handler.execute(user,
            request)
    }
}
