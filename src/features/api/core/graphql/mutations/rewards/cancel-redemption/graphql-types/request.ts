import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    IsUUID,
} from "class-validator"

/**
 * Ops request to void a redemption — refunds the spent Coin (see
 * {@link ../cancel-redemption.resolver}).
 */
@InputType({
    description: "Cancel a reward redemption, refunding its cost to the user's spendable balance.",
})
export class CancelRedemptionRequest {
    /** The redemption to cancel — must not already be `cancelled`, checked in the handler. */
    @Field(
        () => ID,
        {
            description: "Id of the redemption to cancel.",
        },
    )
    // must be a real redemption uuid — existence + status are checked in the handler
    @IsUUID()
        redemptionId: string
}
