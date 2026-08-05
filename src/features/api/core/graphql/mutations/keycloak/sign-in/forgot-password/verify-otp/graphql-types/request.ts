import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsString,
    IsUUID,
    Matches,
} from "class-validator"

@InputType({
    description: "Input for verifying forgot-password OTP.",
})
/**
 * Challenge + OTP only — the new password is read from the server-held
 * challenge payload, not re-submitted, so a stolen OTP cannot set an attacker password.
 */
export class ForgotPasswordVerifyOtpRequest {
    @Field(() => String,
        {
            description: "Challenge id returned from forgotPasswordInit.",
        })
    @IsUUID()
        challengeId: string

    @Field(() => String,
        {
            description: "6-digit OTP code sent to email.",
        })
    @IsString()
    @Matches(/^\d{6}$/,
        {
            message: "OTP must be 6 digits",
        })
        otp: string
}