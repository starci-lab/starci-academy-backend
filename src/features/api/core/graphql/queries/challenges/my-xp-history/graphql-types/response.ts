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

@ObjectType({
    description: "One XP-earning event in the history.",
})
/**
 * One XP-earning event in the user's history.
 */
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

@ObjectType({
    description: "Paginated XP-earning history.",
})
/**
 * Paginated XP-earning history (newest first).
 */
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

@ObjectType({
    description: "Response wrapper for the myXpHistory query.",
})
/**
 * Response wrapper for the myXpHistory query.
 */
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
