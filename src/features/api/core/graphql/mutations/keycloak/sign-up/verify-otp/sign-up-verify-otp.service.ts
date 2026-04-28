import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignUpVerifyOtpCommand,
} from "./sign-up-verify-otp.command"
import type {
    SignUpVerifyOtpCommandResult,
    SignUpVerifyOtpInput,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

@Injectable()
export class SignUpVerifyOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SignUpVerifyOtpInput>,
    ): Promise<SignUpVerifyOtpCommandResult> {
        return this.commandBus.execute(
            new SignUpVerifyOtpCommand(params),
        )
    }
}

