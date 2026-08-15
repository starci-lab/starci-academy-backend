import {
    Field,
    ID,
    InputType,
    Int,
    registerEnumType,
} from "@nestjs/graphql"
import {
    CoursePriceQuoteIntent,
} from "@modules/bussiness/course-pricing/types"

registerEnumType(CoursePriceQuoteIntent,
    {
        name: "CoursePriceQuoteIntent",
        description: "Whether course ids are independent discovery offers or one checkout order.",
    })

@InputType()
/** Canonical request for pricing one or many courses. */
export class CoursePriceQuotesRequest {
    @Field(() => [ID])
        courseIds: Array<string>

    @Field(() => CoursePriceQuoteIntent)
        intent: CoursePriceQuoteIntent

    @Field(() => String,
        {
            nullable: true 
        })
        voucherCode?: string

    @Field(() => Int,
        {
            nullable: true 
        })
        installmentMonths?: number
}
