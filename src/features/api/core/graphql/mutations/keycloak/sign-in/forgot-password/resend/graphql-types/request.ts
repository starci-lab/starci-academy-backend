import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsUUID,
} from "class-validator"

@InputType({
    description: "Input for resending forgot-password OTP for an existing challenge.",
})
/**
 * Only the challenge id — email/password stay on the server challenge so a
 * resend cannot swap the intended reset target.
 */
export class ForgotPasswordResendOtpRequest {
    @Field(() => String,
        {
            description: "Challenge id returned from forgotPasswordInit.",
        })
    @IsUUID()
        challengeId: string
}