import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Payload of signUp: challenge id and expiry.",
})
export class SignUpInitData {
    @Field(() => String, {
        description: "Opaque challenge id; use it for signUpVerifyOtp.",
    })
        challengeId: string

    @Field(() => Number, {
        description: "OTP expiry in seconds.",
    })
        expiresInSeconds: number
}

@ObjectType({
    description: "Response wrapper for the signUp mutation.",
})
export class SignUpResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SignUpInitData>
{
    @Field(() => SignUpInitData, {
        description: "Sign-up init challenge payload.",
    })
        data: SignUpInitData
}

