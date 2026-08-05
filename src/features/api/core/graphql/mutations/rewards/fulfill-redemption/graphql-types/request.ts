import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    IsUUID,
} from "class-validator"

@InputType({
    description: "Mark a pending physical reward redemption as fulfilled (shipped).",
})
/**
 * Ops request to mark a `pending` physical redemption `fulfilled` (shipped).
 */
export class FulfillRedemptionRequest {
    /** The redemption to fulfil -- must currently be `pending`, checked in the handler. */
    @Field(
        () => ID,
        {
            description: "Id of the redemption to fulfil.",
        },
    )
    // must be a real redemption uuid -- existence + status are checked in the handler
    @IsUUID()
        redemptionId: string
}
