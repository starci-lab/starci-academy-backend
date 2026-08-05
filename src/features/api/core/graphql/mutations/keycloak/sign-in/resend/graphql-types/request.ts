import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsUUID,
} from "class-validator"

@InputType({
    description: "Input for resending sign-in OTP for an existing challenge.",
})
/**
 * Only the challenge id -- parked tokens stay on the server challenge so a
 * resend cannot retarget login to another account.
 */
export class SignInResendOtpRequest {
    @Field(() => String,
        {
            description: "Challenge id returned from signInInit.",
        })
    @IsUUID()
        challengeId: string
}
