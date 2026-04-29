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
export class SignInResendOtpRequest {
    @Field(() => String,
        {
            description: "Challenge id returned from signInInit.",
        })
    @IsUUID()
        challengeId: string
}
