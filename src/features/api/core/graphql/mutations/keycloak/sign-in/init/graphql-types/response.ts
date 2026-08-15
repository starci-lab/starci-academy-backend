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
    description: "Sign-in init payload: either an OTP challenge or a completed local test session.",
})
/**
 * Public result of sign-in init. Production and ordinary users receive a
 * challenge; the explicitly enabled local test identity receives a session.
 */
export class SignInInitData {
    @Field(() => String,
        {
            nullable: true,
            description: "Opaque challenge id; use it for signInVerifyOtp.",
        })
        challengeId?: string

    @Field(() => Int,
        {
            nullable: true,
            description: "OTP expiry in seconds.",
        })
        expiresInSeconds?: number

    @Field(() => String,
        {
            nullable: true,
            description: "Access token when an explicitly enabled local test sign-in completes immediately.",
        })
        accessToken?: string
}

/** Internal sign-in init result; impossible mixed challenge/session states do not compile. */
export type SignInInitCommandResult =
    | {
        kind: "challenge"
        data: Required<Pick<SignInInitData, "challengeId" | "expiresInSeconds">>
    }
    | {
        kind: "session"
        data: Required<Pick<SignInInitData, "accessToken">>
        refreshToken: string
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
            description: "Sign-in challenge or completed local test session payload.",
        })
        data: SignInInitData
}

