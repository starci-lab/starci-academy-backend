import type {
    SignInVerifyOtpData,
} from "../../../verify-otp/graphql-types/response"

/**
 * Internal command result: GraphQL data plus the refresh token kept off the
 * schema so the resolver can lock it in an httpOnly cookie.
 */
export interface ForgotPasswordVerifyOtpResponse {
    data: SignInVerifyOtpData
    refreshToken: string
}