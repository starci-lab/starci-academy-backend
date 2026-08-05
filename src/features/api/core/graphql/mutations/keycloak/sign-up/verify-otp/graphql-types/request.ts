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
    description: "Input for verifying OTP and completing sign-up.",
})
/**
 * Challenge + OTP only — profile/password come from the server-held payload
 * so a stolen OTP cannot finish signup as a different identity.
 */
export class SignUpVerifyOtpInput {
    @Field(() => String,
        {
            description: "Challenge id returned from signUp.",
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

