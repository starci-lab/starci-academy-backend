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

/**
 * One XP-earning event in the user's history.
 */
@ObjectType({
    description: "One XP-earning event in the history.",
})
export class XpHistoryItemObject {
    @Field(
        () => ID,
        {
            description: "XP event row id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Where the XP came from (challenge / lessonRead / milestone).",
        },
    )
        source: string

    @Field(
        () => Int,
        {
            description: "XP amount earned in this event.",
        },
    )
        amount: number

    @Field(
        () => Int,
        {
            description: "Reward points granted by this event.",
        },
    )
        points: number

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Course this XP belongs to; null for course-agnostic events.",
        },
    )
        courseId: string | null

    @Field(
        () => Date,
        {
            description: "When the XP was earned.",
        },
    )
        createdAt: Date
}

/**
 * Paginated XP-earning history (newest first).
 */
@ObjectType({
    description: "Paginated XP-earning history.",
})
export class MyXpHistoryResponseData {
    @Field(
        () => [XpHistoryItemObject],
        {
            description: "XP event rows for the requested page, newest first.",
        },
    )
        items: Array<XpHistoryItemObject>

    @Field(
        () => Int,
        {
            description: "Total number of XP event rows for the user (across all pages).",
        },
    )
        total: number
}

/**
 * Response wrapper for the myXpHistory query.
 */
@ObjectType({
    description: "Response wrapper for the myXpHistory query.",
})
export class MyXpHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyXpHistoryResponseData>
{
    @Field(
        () => MyXpHistoryResponseData,
        {
            nullable: true,
            description: "Paginated XP-earning history.",
        },
    )
        data: MyXpHistoryResponseData
}
