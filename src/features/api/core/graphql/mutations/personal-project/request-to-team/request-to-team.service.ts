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
