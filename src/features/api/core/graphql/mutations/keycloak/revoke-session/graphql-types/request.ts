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
