import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Payload of signIn: challenge id and expiry.",
})
export class SignInInitData {
    @Field(() => String,
        {
            description: "Opaque challenge id; use it for signInVerifyOtp.",
        })
        challengeId: string

    @Field(() => Number,
        {
            description: "OTP expiry in seconds.",
        })
        expiresInSeconds: number
}

@ObjectType({
    description: "Response wrapper for the signInInit mutation.",
})
export class SignInResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SignInInitData>
{
    @Field(() => SignInInitData,
        {
            description: "Sign-in init challenge payload.",
        })
        data: SignInInitData
}

