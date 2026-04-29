import type {
    SignInVerifyOtpData,
} from "../../../verify-otp/graphql-types"

export interface ForgotPasswordVerifyOtpCommandResult {
    data: SignInVerifyOtpData
    refreshToken: string
}