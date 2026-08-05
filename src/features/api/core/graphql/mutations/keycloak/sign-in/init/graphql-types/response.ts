import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Payload of signIn: challenge id and expiry.",
})
/**
 * Opaque challenge handle for the OTP step. Tokens stay server-side until
 * verify so this payload is safe to expose to the unauthenticated client.
 */
export class SignInInitData {
    @Field(() => String,
        {
            description: "Opaque challenge id; use it for signInVerifyOtp.",
        })
        challengeId: string

    @Field(() => Int,
        {
            description: "OTP expiry in seconds.",
        })
        expiresInSeconds: number
}

@ObjectType({
    description: "Response wrapper for the signInInit mutation.",
})
/**
 * Envelope reused by sign-in and forgot-password init/resend. `data` is
 * nullable for the interceptor error path.
 */
export class SignInResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SignInInitData>
{
    @Field(() => SignInInitData,
        {
            nullable: true,
            description: "Sign-in init challenge payload.",
        })
        data: SignInInitData
}

