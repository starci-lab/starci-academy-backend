import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    isAbstract: true,
    description: "Response data for line chart (count of data points).",
})
/** GraphQL type for line chart response (count). */
export class LineChartResponseData {
    @Field(() => Int,
        {
            description: "The total number of data points in the line chart.",
        })
        count: number
}
