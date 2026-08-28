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
    GraphQLTypeAuthenticationType,
} from "../enums/authentication-type"
import {
    BackgroundEffect,
    GraphQLTypeBackgroundEffect,
} from "../enums/background-effect"
import {
    WorkMode,
    GraphQLTypeWorkMode,
} from "../enums/work-mode"

@ObjectType({
    description: "Application user entity mapped from Keycloak identity."
})
@Entity("users")
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
     * null when 2FA has never been set up. NOT exposed via GraphQL -- secrets
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
     * Marks a disposable account owned by the UAT harness.
     * Internal fixture metadata; deliberately not exposed through GraphQL.
     */
    @Column({
        name: "is_uat",
        type: "boolean",
        default: false,
    })
        isUat: boolean

    /**
     * The user's spendable Coin balance -- the account currency that funds the
     * reward store (voucher + AI-credit top-up + streak-freeze + physical
     * rewards) and ranks the global leaderboard. Credited by the flat per-event
     * reward (`xp_histories.points`: lessonRead=5, challengePassed=20,
     * milestonePassed=30, coding=problem points) and debited by spending
     * (streak freeze; reward redemptions are derived, not debited here).
     */
    @Field(() => Int,
        {
            description: "The user's spendable Coin balance."
        })
    @Column({
        name: "coin_balance",
        type: "int",
        default: 0
    })
        coinBalance: number

    /**
     * Profile visibility toggle (Facebook-style "lock profile"). When true, only
     * the owner sees the full profile; other viewers (signed-in or anonymous) get
     * just the public header (avatar / name / handle) and a "this profile is
     * private" notice -- the activity, achievements, courses and contribution tabs
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

    /**
     * "Open to work" flag the user opts into on their profile. When true, the
     * profile shows a hiring badge and the user signals availability to recruiters
     * / headhunters. Public (shown in the header). Defaults to false.
     */
    @Field(() => Boolean,
        {
            description: "When true the user is open to work (shows a hiring badge)."
        })
    @Column({
        name: "open_to_work",
        type: "boolean",
        default: false
    })
        openToWork: boolean

    /**
     * Whether the user receives the daily activity-digest email (new followers,
     * replies, community activity). Opt-out: defaults to true; the digest cron
     * skips users who set this to false, and the digest email links here to toggle.
     */
    @Field(() => Boolean,
        {
            description: "When true the user receives the daily activity-digest email."
        })
    @Column({
        name: "email_digest_enabled",
        type: "boolean",
        default: true
    })
        emailDigestEnabled: boolean

    /**
     * Slug of the achievement the user pins as their profile mascot (its rank ring
     * frames the avatar). Null = none chosen (the UI shows an "add" affordance to
     * the owner). Public. Not FK-constrained -- it mirrors a seeded achievement slug.
     */
    @Field(() => String,
        {
            nullable: true,
            description: "Slug of the pinned mascot achievement (frames the avatar); null = none.",
        })
    @Column({
        name: "featured_achievement_slug",
        type: "varchar",
        length: 128,
        nullable: true,
    })
        featuredAchievementSlug: string | null

    /**
     * The user's self-set weekly learning goal, in number of lessons. Drives the
     * dashboard "weekly goal" progress ring (lessons read this week vs. this
     * target). Null = the user has not set a goal yet (the UI shows a "set a goal"
     * affordance instead of a ring). Clamped into [0, 100] on write.
     */
    @Field(() => Int,
        {
            nullable: true,
            description: "Self-set weekly learning goal in lessons; null = no goal set.",
        })
    @Column({
        name: "weekly_goal_lessons",
        type: "int",
        nullable: true,
    })
        weeklyGoalLessons: number | null

    /**
     * Per-KPI weekly targets the user has set for the dashboard weekly KPI
     * summary + the `/kpi` editor -- a map of {@link KpiKey} -> target count
     * (e.g. `{ lessons: 5, xp: 300 }`). A key absent / 0 means "no target set"
     * for that KPI (it is excluded from the composite score). Not exposed
     * directly via GraphQL -- read server-side by the `myKpis` query.
     */
    @Column({
        name: "weekly_kpi_targets",
        type: "jsonb",
        default: {
        },
    })
        weeklyKpiTargets: Record<string, number>

    /**
     * Number of unused streak freezes the user owns. Bought with points
     * (`buyStreakFreeze`, capped at 3) and consumed automatically by the daily
     * `consumeStreakFreezeForMisses` cron when the user misses a day, which
     * inserts a protected day so the streak survives. Defaults to 0.
     */
    @Field(() => Int,
        {
            description: "Number of unused streak freezes the user owns (max 3).",
        })
    @Column({
        name: "streak_freezes",
        type: "int",
        default: 0,
    })
        streakFreezes: number

    /**
     * Professional headline shown under the user's name (e.g. "Backend Engineer -
     * NestJS"). The recruiter-facing one-liner on the public profile. Null until
     * the user sets one. Public.
     */
    @Field(() => String,
        {
            nullable: true,
            description: "Professional headline / role title shown under the user's name.",
        })
    @Column({
        name: "role_title",
        type: "varchar",
        length: 80,
        nullable: true,
    })
        roleTitle: string | null

    /**
     * Free-text location (e.g. "Hanoi, Vietnam") shown on the profile next to
     * the work-mode chip. Null when unset. Public.
     */
    @Field(() => String,
        {
            nullable: true,
            description: "Free-text location shown on the user's profile.",
        })
    @Column({
        name: "location",
        type: "varchar",
        length: 100,
        nullable: true,
    })
        location: string | null

    /**
     * Preferred work arrangement (remote / hybrid / on-site) advertised next to
     * the "open to work" badge. Null when the user has not stated a preference.
     * Public.
     */
    @Field(() => GraphQLTypeWorkMode,
        {
            nullable: true,
            description: "Preferred work arrangement (remote / hybrid / on-site).",
        })
    @Column({
        type: "enum",
        name: "work_mode",
        enum: WorkMode,
        enumName: "work_mode",
        nullable: true,
    })
        workMode: WorkMode | null

    /**
     * Public LinkedIn profile URL the user surfaces on their profile. Null when
     * unset. Public.
     */
    @Field(() => String,
        {
            nullable: true,
            description: "Public LinkedIn profile URL.",
        })
    @Column({
        name: "linkedin_url",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        linkedinUrl: string | null

    /**
     * Personal website / portfolio URL the user surfaces on their profile. Null
     * when unset. Public.
     */
    @Field(() => String,
        {
            nullable: true,
            description: "Personal website / portfolio URL.",
        })
    @Column({
        name: "website_url",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        websiteUrl: string | null

    /**
     * User-chosen accent color (hex, e.g. `#e84393`) overriding the default
     * brand `--accent` token app-wide. Null = the app's default accent. Purely
     * cosmetic -- independent of light/dark mode (which stays a separate axis).
     */
    @Field(() => String,
        {
            nullable: true,
            description: "User-chosen accent color (hex); null = default brand accent.",
        })
    @Column({
        name: "accent_color",
        type: "varchar",
        length: 9,
        nullable: true,
    })
        accentColor: string | null

    /**
     * Ambient background effect chosen for the app chrome (never the lesson
     * reading column). Independent of light/dark mode. Defaults to `None`.
     */
    @Field(() => GraphQLTypeBackgroundEffect,
        {
            description: "Ambient background effect chosen for the app chrome.",
        })
    @Column({
        type: "enum",
        name: "background_effect",
        enum: BackgroundEffect,
        enumName: "background_effect",
        default: BackgroundEffect.None,
    })
        backgroundEffect: BackgroundEffect


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
