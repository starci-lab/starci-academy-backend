import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignUpInitCommand,
} from "./sign-up-init.command"
import type {
    SignUpInitRequest,
} from "./graphql-types/request"
import type {
    SignUpInitData,
} from "./graphql-types/response"
import {
    ExecuteParams,
} from "../../../../../types/execute"

@Injectable()
/** Forwards sign-up init to the command bus so the resolver stays a thin leaf. */
export class SignUpInitService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SignUpInitRequest>,
    ): Promise<SignUpInitData> {
        return this.commandBus.execute(
            new SignUpInitCommand(params),
        )
    }
}

