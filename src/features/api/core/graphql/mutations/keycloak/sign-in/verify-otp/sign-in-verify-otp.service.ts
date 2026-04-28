import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignInVerifyOtpCommand,
} from "./sign-in-verify-otp.command"
import type {
    SignInVerifyOtpCommandResult,
    SignInVerifyOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

@Injectable()
export class SignInVerifyOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SignInVerifyOtpRequest>,
    ): Promise<SignInVerifyOtpCommandResult> {
        return this.commandBus.execute(
            new SignInVerifyOtpCommand(params),
        )
    }
}

