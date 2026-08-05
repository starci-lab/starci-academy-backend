import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignInResendOtpCommand,
} from "./sign-in-resend-otp.command"
import type {
    SignInInitData,
} from "../init/graphql-types/response"
import type {
    SignInResendOtpRequest,
} from "./graphql-types/request"
import {
    ExecuteParams,
} from "../../../../../types/execute"

@Injectable()
/** Forwards sign-in OTP resend to the command bus so the resolver stays a thin leaf. */
export class SignInResendOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SignInResendOtpRequest>,
    ): Promise<SignInInitData> {
        return this.commandBus.execute(
            new SignInResendOtpCommand(params),
        )
    }
}
