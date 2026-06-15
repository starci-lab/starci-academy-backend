import {
    Field,
    Int,
    ObjectType
} from "@nestjs/graphql"
import {
    Column, Entity, OneToMany, OneToOne
} from "typeorm"
import {
    UuidAbstractEntity
} from "./abstract"
import {
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    UserChallengeSubmissionEntity,
} from "./user-challenge-submission.entity"
import {
    AiSubscriptionEntity,
} from "./ai-subscription.entity"
import {
    MembershipEntity,
} from "./membership.entity"
import {
    AuthenticationType,
    GraphQLTypeAuthenticationType
} from "../enums"

/**
 * Represents an application-level user.
 *
 * This entity stores business-related user data and acts as a bridge
 * between the application domain and the external identity provider (Keycloak).
 *
 * Notes:
 * - Authentication & credentials are managed by Keycloak.
 * - This table should only contain data required by the application domain.
 * - The `keycloakId` maps to the `sub` claim in the Keycloak JWT.
 */
@ObjectType({
    description: "Application user entity mapped from Keycloak identity."
})
@Entity("users")
export class UserEntity extends UuidAbstractEntity {

    /**
     * Username of the user.
     *
     * This is a cached snapshot from Keycloak (preferred_username),
     * used for display and querying within the application.
     */
    @Field(() => String,
        {
            nullable: true,
            description: "Username of the user."
        })
    @Column({
        name: "username",
        type: "varchar",
        length: 50,
        nullable: true
    })
        username: string
    
    /**
     * Email address of the user.
     *
     * This value is synchronized from Keycloak and should not be treated
     * as the source of truth for authentication.
     */
    @Field(() => String,
        {
            description: "Email of the user.",
            nullable: true
        })
    @Column({
        name: "email",
        type: "varchar",
        length: 255,
        nullable: true
    })
        email: string | null
    
    /**
     * Unique identifier of the user in Keycloak.
     *
     * Maps to the `sub` claim in the JWT token.
     * Used to associate external identity with internal user record.
     */
    @Field(() => String,
        {
            description: "Keycloak ID of the user (JWT sub)."
        })
    @Column({
        name: "keycloak_id",
        type: "varchar",
        length: 64,
        unique: true
    })
        keycloakId: string

    /**
     * Avatar of the user.
     */
    @Field(() => String,
        {
            description: "Avatar of the user.",
            nullable: true
        })
    @Column({
        name: "avatar",
        type: "varchar",
        length: 255,
        nullable: true
    })
        avatar: string | null

    /**
     * Display name freely editable by the user on the profile page.
     *
     * Unlike `username` (a cached snapshot from Keycloak), this is owned by the
     * application and is what the profile UI shows. Null until the user sets one,
     * in which case the UI falls back to `username`.
     */
    @Field(() => String,
        {
            description: "Display name editable by the user (falls back to username when null).",
            nullable: true
        })
    @Column({
        name: "display_name",
        type: "varchar",
        length: 100,
        nullable: true
    })
        displayName: string | null

    /**
     * Short free-text bio / tagline shown under the user's name on the profile.
     */
    @Field(() => String,
        {
            description: "Short bio / tagline shown on the user's profile.",
            nullable: true
        })
    @Column({
        name: "bio",
        type: "varchar",
        length: 280,
        nullable: true
    })
        bio: string | null

    /**
     * Whether app-level two-factor authentication (TOTP) is enabled for the user.
     *
     * This is the configuration flag only; enforcement at a specific login flow
     * is a separate concern that is not wired yet.
     */
    @Field(() => Boolean,
        {
            description: "Whether two-factor authentication (TOTP) is enabled."
        })
    @Column({
        name: "two_factor_enabled",
        type: "boolean",
        default: false
    })
        twoFactorEnabled: boolean

    /**
     * AES-256-GCM encrypted TOTP shared secret (JSON-stringified payload), or
     * null when 2FA has never been set up. NOT exposed via GraphQL — secrets
     * must never leave the server. Holds the pending secret between `setupTwoFactor`
     * and `confirmTwoFactor`, and the active secret while enabled.
     */
    @Column({
        name: "two_factor_secret",
        type: "varchar",
        length: 512,
        nullable: true
    })
        twoFactorSecret: string | null

    /**
     * GitHub username used for repository/team automation.
     */
    @Field(() => String,
        {
            description: "GitHub username of the user.",
            nullable: true
        })
    @Column({
        name: "github_username",
        type: "varchar",
        length: 39,
        nullable: true
    })
        githubUsername: string | null

    /**
     * Soft delete flag.
     *
     * Indicates whether the user is logically deleted in the application.
     * Does NOT affect the user in Keycloak.
     */
    @Field(() => Boolean,
        {
            description: "Indicates whether the user is soft-deleted."
        })
    @Column({
        name: "is_deleted",
        type: "boolean",
        default: false
    })
        isDeleted: boolean

    /**
     * Cumulative coding-practice score. Earned per problem (by difficulty:
     * easy 10 / medium 15 / hard 20) the first time the user solves it, and only
     * when they did NOT reveal that problem's reference solution before solving.
     * Standalone from the per-course leaderboard XP (coding practice is global).
     */
    @Field(() => Int,
        {
            description: "Cumulative coding-practice points earned by the user."
        })
    @Column({
        name: "coding_points",
        type: "int",
        default: 0
    })
        codingPoints: number

    /**
     * Cumulative reward points earned from course activities that also grant XP
     * (passed challenges, read lessons, passed milestone tasks). Standalone from
     * `codingPoints` (coding practice) and from the per-course leaderboard XP.
     */
    @Field(() => Int,
        {
            description: "Cumulative reward points earned from XP-granting course activities."
        })
    @Column({
        name: "reward_points",
        type: "int",
        default: 0
    })
        rewardPoints: number

    /**
     * Profile visibility toggle (Facebook-style "lock profile"). When true, only
     * the owner sees the full profile; other viewers (signed-in or anonymous) get
     * just the public header (avatar / name / handle) and a "this profile is
     * private" notice — the activity, achievements, courses and contribution tabs
     * are withheld. Defaults to false (public).
     */
    @Field(() => Boolean,
        {
            description: "When true the profile is locked: only the owner sees the full content."
        })
    @Column({
        name: "profile_locked",
        type: "boolean",
        default: false
    })
        profileLocked: boolean


    @Field(
        () => [EnrollmentEntity],
        {
            nullable: true,
            description: "Course enrollments for this user.",
        },
    )
    @OneToMany(() => EnrollmentEntity,
        (enrollment: EnrollmentEntity) => enrollment.user,
        {
            cascade: true,
        })
        enrollments: Array<EnrollmentEntity>

    @Field(
        () => [UserChallengeSubmissionEntity],
        {
            nullable: true,
            description: "Join rows between this user and challenge submissions.",
        },
    )
    @OneToMany(
        () => UserChallengeSubmissionEntity,
        (userSubmission: UserChallengeSubmissionEntity) => userSubmission.user,
        {
            cascade: true,
        },
    )
        userSubmissions: Array<UserChallengeSubmissionEntity>

    @Field(() => GraphQLTypeAuthenticationType,
        {
            description: "The type of authentication used by the user.",
        },
    )
    @Column({
        type: "enum",
        name: "authentication_type",
        enum: AuthenticationType,
        enumName: "authentication_type",
        default: AuthenticationType.Google
    })
        authenticationType: AuthenticationType

    /**
     * AI entitlement (Auto allowance + Premium credits) for this user.
     */
    @Field(
        () => AiSubscriptionEntity,
        {
            nullable: true,
            description: "AI entitlement (Auto allowance + Premium credits).",
        },
    )
    @OneToOne(
        () => AiSubscriptionEntity,
        (aiSubscription: AiSubscriptionEntity) => aiSubscription.user,
        {
            cascade: true,
            nullable: true,
        },
    )
        aiSubscription?: AiSubscriptionEntity

    /**
     * Community membership (premium blog + community + course discount) for this user.
     */
    @Field(
        () => MembershipEntity,
        {
            nullable: true,
            description: "Community membership (premium blog + community + course discount).",
        },
    )
    @OneToOne(
        () => MembershipEntity,
        (membership: MembershipEntity) => membership.user,
        {
            cascade: true,
            nullable: true,
        },
    )
        membership?: MembershipEntity
}