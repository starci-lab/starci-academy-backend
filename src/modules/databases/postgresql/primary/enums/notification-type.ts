import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Kind of in-app notification delivered to a single recipient and persisted in
 * the {@link NotificationEntity} table. The `type` drives the icon + phrasing the
 * FE renders; the row's `metadata.target` carries the clickable destination.
 *
 * Unlike {@link ActivityType} (a public, append-only home-feed ledger), a
 * notification is private to its recipient and has a read/unread lifecycle.
 */
export enum NotificationType {
    /** Generic system message with no specific domain target. */
    System = "system",
    /** A challenge submission finished grading (passed or failed). */
    ChallengeGraded = "challengeGraded",
    /** A coding submission finished judging (a verdict is available). */
    CodingGraded = "codingGraded",
    /** A personal-project milestone task finished grading. */
    MilestoneGraded = "milestoneGraded",
    /** Another user started following the recipient. */
    NewFollower = "newFollower",
    /** Someone replied to one of the recipient's discussion comments. */
    CommentReply = "commentReply",
    /** A paid AI subscription / membership tier was granted to the recipient. */
    SubscriptionGranted = "subscriptionGranted",
    /** A broadcast announcement fanned out to the recipient. */
    Announcement = "announcement",
}

/** GraphQL enum mirror of {@link NotificationType}. */
export const GraphQLTypeNotificationType = createEnumType(NotificationType)

registerEnumType(
    GraphQLTypeNotificationType,
    {
        name: "NotificationType",
        description: "Kind of in-app notification delivered to a single recipient.",
        valuesMap: {
            [NotificationType.System]: {
                description: "Generic system message with no specific domain target.",
            },
            [NotificationType.ChallengeGraded]: {
                description: "A challenge submission finished grading.",
            },
            [NotificationType.CodingGraded]: {
                description: "A coding submission finished judging.",
            },
            [NotificationType.MilestoneGraded]: {
                description: "A personal-project milestone task finished grading.",
            },
            [NotificationType.NewFollower]: {
                description: "Another user started following the recipient.",
            },
            [NotificationType.CommentReply]: {
                description: "Someone replied to one of the recipient's comments.",
            },
            [NotificationType.SubscriptionGranted]: {
                description: "A paid AI subscription / membership tier was granted.",
            },
            [NotificationType.Announcement]: {
                description: "A broadcast announcement fanned out to the recipient.",
            },
        },
    },
)
