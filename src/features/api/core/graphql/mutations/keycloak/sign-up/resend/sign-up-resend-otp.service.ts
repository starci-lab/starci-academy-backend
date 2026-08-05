import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SignUpResendOtpCommand,
} from "./sign-up-resend-otp.command"
import type {
    SignUpInitData,
} from "../init/graphql-types"
import type {
    SignUpResendOtpRequest,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../../types"

@Injectable()
/** Forwards sign-up OTP resend to the command bus so the resolver stays a thin leaf. */
export class SignUpResendOtpService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SignUpResendOtpRequest>,
    ): Promise<SignUpInitData> {
        return this.commandBus.execute(
            new SignUpResendOtpCommand(params),
        )
    }
}
