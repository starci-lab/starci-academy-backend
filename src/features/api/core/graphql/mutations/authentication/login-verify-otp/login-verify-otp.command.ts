import type {
    Locale,
} from "@modules/databases"
import type {
    LoginVerifyOtpInput,
} from "./graphql-types"

export interface LoginVerifyOtpCommandParams {
    input: LoginVerifyOtpInput
    locale: Locale
}

export class LoginVerifyOtpCommand {
    constructor(
        readonly params: LoginVerifyOtpCommandParams,
    ) {}
}

