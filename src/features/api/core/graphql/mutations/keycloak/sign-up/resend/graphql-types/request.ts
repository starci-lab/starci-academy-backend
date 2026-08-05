import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsUUID,
} from "class-validator"

@InputType({
    description: "Input for resending sign-up OTP for an existing challenge.",
})
/**
 * Only the challenge id — profile/password stay on the server challenge so a
 * resend cannot retarget registration.
 */
export class SignUpResendOtpRequest {
    @Field(() => String,
        {
            description: "Challenge id returned from signUpInit.",
        })
    @IsUUID()
        challengeId: string
}
