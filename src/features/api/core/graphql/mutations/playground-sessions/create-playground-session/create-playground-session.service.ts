import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CreatePlaygroundSessionCommand,
} from "./create-playground-session.command"
import type {
    CreatePlaygroundSessionRequest,
    CreatePlaygroundSessionResponseData,
} from "./graphql-types"

@Injectable()
export class CreatePlaygroundSessionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<CreatePlaygroundSessionRequest>,
    ): Promise<CreatePlaygroundSessionResponseData> {
        return this.commandBus.execute(
            new CreatePlaygroundSessionCommand(params),
        )
    }
}
