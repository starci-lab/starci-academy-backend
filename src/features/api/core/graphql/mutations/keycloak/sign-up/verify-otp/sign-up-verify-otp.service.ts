import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignUpVerifyOtpCommand,
} from "./sign-up-verify-otp.command"
import {
    ExecuteParams,
} from "../../../../../types/execute"
import {
    SignUpVerifyOtpInput,
} from "./graphql-types/request"
import {
    SignUpVerifyOtpResult,
} from "./graphql-types/response"

@Injectable()
/** Forwards sign-up OTP verify to the command bus so the resolver can set cookies. */
export class SignUpVerifyOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SignUpVerifyOtpInput>,
    ): Promise<SignUpVerifyOtpResult> {
        return this.commandBus.execute(
            new SignUpVerifyOtpCommand(params),
        )
    }
}

