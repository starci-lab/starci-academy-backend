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
    CreatePlaygroundSessionCommand,
} from "./create-playground-session.command"
import type {
    CreatePlaygroundSessionRequest,
} from "./graphql-types/request"
import type {
    CreatePlaygroundSessionResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin command-bus hop so the resolver never mints pairing codes or
 * redacts step hints itself.
 */
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
