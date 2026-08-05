import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "One of the current user's logged-in device sessions.",
})
/**
 * One device row on the account-security / "logged-in devices" screen.
 * `sessionId` (not `id`) is what `revokeSession` consumes; `current` is
 * true for the requesting device so the FE can highlight "this device"
 * and avoid a self-revoke footgun.
 */
export class LoginSessionObject {
    @Field(
        () => ID,
        {
            description: "Stable primary-key id of the session row.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "The session id; pass this to revokeSession to log the device out.",
        },
    )
        sessionId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Device class, e.g. \"desktop\" | \"mobile\" | \"tablet\".",
        },
    )
        deviceType: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Operating system name, e.g. \"Windows\" | \"Mac OS\".",
        },
    )
        os: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Browser name, e.g. \"Chrome\" | \"Safari\".",
        },
    )
        browser: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Client IP captured at login.",
        },
    )
        ipAddress: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Human-readable location derived from the IP, e.g. \"Ho Chi Minh City, VN\".",
        },
    )
        location: string | null

    @Field(
        () => Date,
        {
            description: "Last-activity timestamp for this session.",
        },
    )
        lastSeenAt: Date

    @Field(
        () => Date,
        {
            description: "Login timestamp for this session.",
        },
    )
        createdAt: Date

    @Field(
        () => Boolean,
        {
            description: "True when this is the device making the current request.",
        },
    )
        current: boolean
}
