import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import type {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    ProSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/pro-subscription.entity"
import {
    GraphQLTypePaymentType,
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    Field,
    ID,
    InputType,
    Int,
    ObjectType,
} from "@nestjs/graphql"

@InputType()
/** Domestic payment selection and redirect URLs for a Pro checkout. */
export class PurchaseProSubscriptionRequest {
    @Field(() => GraphQLTypePaymentType)
        paymentType: PaymentType

    @Field(() => String,
        {
            nullable: true,
        })
        payosReturnUrl?: string

    @Field(() => String,
        {
            nullable: true,
        })
        payosCancelUrl?: string
}

@ObjectType()
/** Mounted public catalog representation of the unified Pro plan. */
export class ProOfferData {
    @Field(() => String)
        planId: string

    @Field(() => String)
        displayName: string

    @Field(() => String)
        description: string

    @Field(() => Int)
        priceVnd: number

    @Field(() => Int)
        billingPeriodMonths: number

    @Field(() => String)
        offerRevision: string

    @Field(() => Int)
        creditsPer5h: number

    @Field(() => Int)
        creditsPerWeek: number

    @Field(() => Boolean)
        enabled: boolean
}

@ObjectType()
/** Standard GraphQL response wrapping the public Pro offer. */
export class ProOfferResponse extends AbstractGraphQLResponse implements IAbstractGraphQLResponse<ProOfferData> {
    @Field(() => ProOfferData,
        {
            nullable: true,
        })
        data: ProOfferData
}

@ObjectType()
/** Current dedicated subscription plus its date-aware active result. */
export class MyProSubscriptionData {
    @Field(() => ProSubscriptionEntity,
        {
            nullable: true,
        })
        subscription: ProSubscriptionEntity | null

    @Field(() => Boolean)
        active: boolean
}

@ObjectType()
/** Standard GraphQL response wrapping the learner's Pro lifecycle. */
export class MyProSubscriptionResponse extends AbstractGraphQLResponse implements IAbstractGraphQLResponse<MyProSubscriptionData> {
    @Field(() => MyProSubscriptionData,
        {
            nullable: true,
        })
        data: MyProSubscriptionData
}

@ObjectType()
/** Composed legacy-or-Pro access decisions returned to learner clients. */
export class LearnerAccessData {
    @Field(() => Boolean) proActive: boolean
    @Field(() => Boolean) course: boolean
    @Field(() => Boolean) community: boolean
    @Field(() => Boolean) premiumBlog: boolean
    @Field(() => Boolean) globalChat: boolean
    @Field(() => Boolean) ai: boolean
    @Field(() => Boolean) mockInterview: boolean
    @Field(() => String) courseSource: string
    @Field(() => String) communitySource: string
    @Field(() => String) aiSource: string
}

@ObjectType()
/** Standard GraphQL response wrapping composed learner access. */
export class LearnerAccessResponse extends AbstractGraphQLResponse implements IAbstractGraphQLResponse<LearnerAccessData> {
    @Field(() => LearnerAccessData,
        {
            nullable: true,
        })
        data: LearnerAccessData
}

@ObjectType()
/** Provider checkout identifiers for one pending Pro purchase. */
export class ProCheckoutData {
    @Field(() => String) checkoutUrl: string
    @Field(() => String) referenceId: string
    @Field(() => ID) transactionId: string
    @Field(() => Int) amount: number
    @Field(() => String,
        {
            nullable: true,
        }) checkoutFields?: string
}

@ObjectType()
/** Standard GraphQL response wrapping a pending Pro checkout. */
export class ProCheckoutResponse extends AbstractGraphQLResponse implements IAbstractGraphQLResponse<ProCheckoutData> {
    @Field(() => ProCheckoutData,
        {
            nullable: true,
        })
        data: ProCheckoutData
}
