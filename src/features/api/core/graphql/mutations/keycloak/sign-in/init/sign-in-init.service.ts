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
    SignInInitData,
    SignInInitRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

@Injectable()
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
    ): Promise<SignInInitData> {
        return this.commandBus.execute(
            new SignInInitCommand(params),
        )
    }
}

