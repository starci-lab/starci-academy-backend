import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    GraphQLTypeNotificationType,
    NotificationType,
} from "@modules/databases"
import GraphQLJSON from "graphql-type-json"

@ObjectType({
    description: "i18n text (key + params) rendered client-side; no stored text.",
})
/**
 * An i18n-renderable text on a notification: a message key + interpolation
 * params. The FE renders `t(key, params)` -- no server-side text.
 */
export class NotificationI18nTextObject {
    @Field(
        () => String,
        {
            description: "i18n message key.",
        },
    )
        key: string

    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Interpolation params for the key (counts, names, token labels).",
        },
    )
        params: Record<string, string> | null
}

@ObjectType({
    description: "Clickable destination snapshot carried on a notification.",
})
/**
 * Clickable destination snapshotted on a notification (resolved to a route on
 * the FE from `entityName` + `id`). Null on the notification when targetless.
 */
export class NotificationTargetObject {
    @Field(
        () => String,
        {
            description: "Target entity class name (route-index namespace, e.g. ChallengeSubmissionEntity).",
        },
    )
        entityName: string

    @Field(
        () => ID,
        {
            description: "Target entity primary key (UUID).",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Human-readable label rendered as the token text.",
        },
    )
        label: string
}

@ObjectType({
    description: "One in-app notification delivered to the recipient.",
})
/**
 * One in-app notification in the recipient's bell list.
 */
export class NotificationObject {
    @Field(
        () => ID,
        {
            description: "Notification row id.",
        },
    )
        id: string

    @Field(
        () => GraphQLTypeNotificationType,
        {
            description: "Kind of notification (drives the FE icon + phrasing).",
        },
    )
        type: NotificationType

    @Field(
        () => NotificationI18nTextObject,
        {
            description: "Headline as i18n (key + params); rendered client-side.",
        },
    )
        title: NotificationI18nTextObject

    @Field(
        () => NotificationI18nTextObject,
        {
            nullable: true,
            description: "Optional supporting line as i18n; null when title is enough.",
        },
    )
        body: NotificationI18nTextObject | null

    @Field(
        () => Boolean,
        {
            description: "Whether the recipient has read the notification.",
        },
    )
        isRead: boolean

    @Field(
        () => NotificationTargetObject,
        {
            nullable: true,
            description: "Clickable destination; null for targetless messages.",
        },
    )
        target: NotificationTargetObject | null

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the recipient read the notification; null while unread.",
        },
    )
        readAt: Date | null

    @Field(
        () => Date,
        {
            description: "When the notification was created.",
        },
    )
        createdAt: Date
}

@ObjectType({
    description: "Paginated notifications for the current user.",
})
/**
 * Paginated bell list for the current user (newest first) + unread total.
 */
export class MyNotificationsResponseData {
    @Field(
        () => [NotificationObject],
        {
            description: "Notification rows for the requested page, newest first.",
        },
    )
        items: Array<NotificationObject>

    @Field(
        () => Int,
        {
            description: "Total rows matching the filter (across all pages).",
        },
    )
        total: number

    @Field(
        () => Int,
        {
            description: "Unread notification count for the user (badge value).",
        },
    )
        unreadCount: number
}

@ObjectType({
    description: "Response wrapper for the myNotifications query.",
})
/**
 * Response wrapper for the myNotifications query.
 */
export class MyNotificationsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyNotificationsResponseData>
{
    @Field(
        () => MyNotificationsResponseData,
        {
            nullable: true,
            description: "Paginated notifications for the current user.",
        },
    )
        data: MyNotificationsResponseData
}
