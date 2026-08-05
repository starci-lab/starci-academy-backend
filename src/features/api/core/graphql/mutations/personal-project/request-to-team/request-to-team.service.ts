import {
    Injectable,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases"
import {
    RequestToTeamHandler,
} from "./request-to-team.handler"
import type {
    RequestToTeamRequest,
    RequestToTeamData,
} from "./graphql-types"

@Injectable()
/**
 * Invokes the handler directly (no CommandBus) — this leaf predates the
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
