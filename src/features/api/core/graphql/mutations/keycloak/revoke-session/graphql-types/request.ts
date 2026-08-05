import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsString,
    MinLength,
} from "class-validator"

@InputType({
    description: "Request for revoking one of the current user's logged-in device sessions.",
})
/**
 * Targets one device session from `mySessions`. The resolver scopes revoke by
 * the caller's keycloakId so a guessed id cannot log out someone else.
 */
export class RevokeSessionRequest {
    @Field(
        () => String,
        {
            description: "The session id (from mySessions) of the device to log out.",
        },
    )
    @IsString()
    @MinLength(1)
        sessionId: string
}
