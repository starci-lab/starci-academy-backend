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
    description: "Input for verifying OTP and completing sign-in.",
})
export class SignInVerifyOtpInput {
    @Field(() => String,
        {
            description: "Challenge id returned from signIn.",
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

