import {
    Field,
    Float,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import type {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    GraphQLTypeDiscountReason,
    type DiscountReason,
} from "@modules/databases/postgresql/primary/enums/discount-reason"
import {
    GraphQLTypePricingPhase,
    type PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    InstallmentOptionItem,
} from "../../course-price-preview/graphql-types/response"

@ObjectType()
/** One course line returned by the canonical quote operation. */
export class CoursePriceQuoteLineData {
    @Field(() => ID) courseId: string
    @Field(() => Int) listPriceVnd: number
    @Field(() => Int) phasePriceVnd: number
    @Field(() => Int) chargedPriceVnd: number
    @Field(() => Float,
        {
            nullable: true 
        }) listPriceUsd: number | null
    @Field(() => Float,
        {
            nullable: true 
        }) phasePriceUsd: number | null
    @Field(() => Float,
        {
            nullable: true 
        }) chargedPriceUsd: number | null
    @Field(() => Int) loyaltyDiscountPercent: number
    @Field(() => Int) bundleDiscountPercent: number
    @Field(() => Int) displayDiscountPercent: number
    @Field(() => GraphQLTypeDiscountReason) discountReason: DiscountReason
    @Field(() => Int) enrolledCount: number
    @Field(() => GraphQLTypePricingPhase) currentPhase: PricingPhase
    @Field(() => GraphQLTypePricingPhase,
        {
            nullable: true 
        }) nextPhase: PricingPhase | null
    @Field(() => Int,
        {
            nullable: true 
        }) seatsRemainingInCurrentPhase: number | null
    @Field(() => Int,
        {
            nullable: true 
        }) nextPhasePriceVnd: number | null
    @Field(() => Float,
        {
            nullable: true 
        }) nextPhasePriceUsd: number | null
}

@ObjectType()
/** Selected installment projection when a term was requested. */
export class SelectedInstallmentData extends InstallmentOptionItem {}

@ObjectType()
/** Canonical quote totals and per-course lines. */
export class CoursePriceQuotesData {
    @Field(() => [CoursePriceQuoteLineData]) lines: Array<CoursePriceQuoteLineData>
    @Field(() => Int) totalListVnd: number
    @Field(() => Int) totalPhaseVnd: number
    @Field(() => Int) totalChargedVnd: number
    @Field(() => Float,
        {
            nullable: true 
        }) totalListUsd: number | null
    @Field(() => Float,
        {
            nullable: true 
        }) totalPhaseUsd: number | null
    @Field(() => Float,
        {
            nullable: true 
        }) totalChargedUsd: number | null
    @Field(() => Int) savingsVnd: number
    @Field(() => Int) bundleDiscountPercent: number
    @Field(() => Int) itemCount: number
    @Field(() => Int,
        {
            nullable: true 
        }) voucherDiscountedPriceVnd: number | null
    @Field(() => Float,
        {
            nullable: true 
        }) voucherDiscountedPriceUsd: number | null
    @Field(() => [InstallmentOptionItem]) installmentOptions: Array<InstallmentOptionItem>
    @Field(() => SelectedInstallmentData,
        {
            nullable: true 
        }) selectedInstallment: SelectedInstallmentData | null
}

@ObjectType()
/** Standard GraphQL response wrapper for coursePriceQuotes. */
export class CoursePriceQuotesResponse extends AbstractGraphQLResponse implements IAbstractGraphQLResponse<CoursePriceQuotesData> {
    @Field(() => CoursePriceQuotesData,
        {
            nullable: true 
        }) data: CoursePriceQuotesData
}
