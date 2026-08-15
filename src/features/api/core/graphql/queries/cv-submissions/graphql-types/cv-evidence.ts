import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "A caller-owned passed StarCi capstone that may back a CV run.",
})
/** Public passed-capstone evidence available for selection into a CV run. */
export class CvCapstoneEvidence {
    @Field(() => ID)
        id: string

    @Field(() => ID)
        courseId: string

    @Field(() => String)
        taskTitle: string

    @Field(() => String)
        milestoneTitle: string

    @Field(() => String)
        courseTitle: string

    @Field(() => Int)
        score: number
}

@ObjectType({
    description: "An immutable passed-capstone snapshot selected into one CV run.",
})
/** Immutable passed-capstone evidence already selected into a CV run. */
export class CvSelectedEvidence extends CvCapstoneEvidence {
    @Field(() => ID)
        milestoneTaskId: string

    @Field(() => ID)
        milestoneId: string

    @Field(() => Date)
        passedAt: Date
}
