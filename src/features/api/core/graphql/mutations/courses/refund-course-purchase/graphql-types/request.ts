import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    IsNotEmpty,
    IsString,
    IsUUID,
    MaxLength,
} from "class-validator"

@InputType({
    description: "Commit a course refund after the provider or bank returned the captured money.",
})
/** Provider-confirmed refund request exposed to the ops GraphQL boundary. */
export class RefundCoursePurchaseRequest {
    @Field(
        () => ID,
        {
            description: "Settled course-purchase transaction to reverse.",
        },
    )
    @IsUUID()
        transactionId: string

    @Field(
        () => String,
        {
            description: "Unique provider/bank reference proving the refund succeeded upstream.",
        },
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
        providerRefundReference: string

    @Field(
        () => String,
        {
            description: "Audit reason for reversing the purchase.",
        },
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
        reason: string
}
