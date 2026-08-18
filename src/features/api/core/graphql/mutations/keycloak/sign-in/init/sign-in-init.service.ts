import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignInInitCommand,
} from "./sign-in-init.command"
import type {
    SignInInitRequest,
} from "./graphql-types/request"
import type {
    SignInInitResponse,
} from "./graphql-types/response"
import {
    ExecuteParams,
} from "../../../../../types/execute"

@Injectable()
/** Forwards sign-in init to the command bus so the resolver stays a thin leaf. */
export class SignInInitService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Execute the sign in init command.
     * @param params - The execute params.
     * @returns The sign in init data.
     */
    async execute(
        params: ExecuteParams<SignInInitRequest>,
    ): Promise<SignInInitResponse> {
        return this.commandBus.execute(
            new SignInInitCommand(params),
        )
    }
}

