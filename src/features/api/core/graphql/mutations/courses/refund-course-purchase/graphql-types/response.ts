import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import type {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    GraphQLTypeTransactionStatus,
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"

@ObjectType({
    description: "Committed course refund and the entitlements it closed.",
})
/** Audit state and entitlement effects from a committed course refund. */
export class RefundCoursePurchaseData {
    @Field(() => ID)
        transactionId: string

    @Field(() => GraphQLTypeTransactionStatus)
        status: TransactionStatus

    @Field(() => String)
        providerRefundReference: string

    @Field(() => [ID])
        revokedCourseIds: Array<string>

    @Field(() => Boolean)
        alreadyRefunded: boolean

    @Field(() => Date)
        refundedAt: Date
}

@ObjectType({
    description: "Response wrapper for refundCoursePurchase.",
})
/** Standard GraphQL response envelope for the course-refund mutation. */
export class RefundCoursePurchaseResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RefundCoursePurchaseData> {
    @Field(
        () => RefundCoursePurchaseData,
        {
            nullable: true,
        },
    )
        data: RefundCoursePurchaseData
}
