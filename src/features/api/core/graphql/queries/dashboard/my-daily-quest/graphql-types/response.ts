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
import {
    DailyQuestKey,
    GraphQLTypeDailyQuestKey,
} from "@modules/databases/postgresql/primary/enums/daily-quest-key"

@ObjectType({
    description: "One daily-quest task with its current progress and target.",
})
/**
 * One daily-quest task: TODAY's `current` progress vs the static `target`.
 */
export class DailyQuestTaskObject {
    @Field(
        () => GraphQLTypeDailyQuestKey,
        {
            description: "Which daily task this row is.",
        },
    )
        key: DailyQuestKey

    @Field(
        () => Int,
        {
            description: "How many of the action the user has done today.",
        },
    )
        current: number

    @Field(
        () => Int,
        {
            description: "How many are required today to complete the task.",
        },
    )
        target: number
}

@ObjectType({
    description: "The viewer's daily quest for today.",
})
/**
 * The viewer's daily quest for today: each task's progress, completion + claim
 * state, and the reward value granted on claim.
 */
export class MyDailyQuestData {
    @Field(
        () => String,
        {
            description: "Today's Asia/Ho_Chi_Minh calendar day (YYYY-MM-DD).",
        },
    )
        date: string

    @Field(
        () => [DailyQuestTaskObject],
        {
            description: "Each daily task with its current progress and target.",
        },
    )
        tasks: Array<DailyQuestTaskObject>

    @Field(
        () => Boolean,
        {
            description: "True when every task's current >= target.",
        },
    )
        allDone: boolean

    @Field(
        () => Boolean,
        {
            description: "True when the reward was already claimed today.",
        },
    )
        claimed: boolean

    @Field(
        () => Int,
        {
            description: "Points granted when the completed quest is claimed.",
        },
    )
        reward: number
}

@ObjectType({
    description: "Response wrapper for the myDailyQuest query.",
})
/**
 * Response wrapper for the myDailyQuest query.
 */
export class MyDailyQuestResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyDailyQuestData> {
    @Field(
        () => MyDailyQuestData,
        {
            nullable: true,
            description: "The viewer's daily quest for today.",
        },
    )
        data: MyDailyQuestData
}
