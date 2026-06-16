import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Request to redeem a single catalog reward by its stable key. For PHYSICAL
 * rewards the shipping fields carry where to send the gift (snapshotted onto the
 * redemption's metadata for ops); they are ignored for digital rewards.
 */
@InputType({
    description: "Redeem a reward from the gifts store.",
})
export class RedeemRewardRequest {
    @Field(
        () => String,
        {
            description: "Stable catalog key of the reward to redeem (e.g. 'streakFreeze').",
        },
    )
        rewardKey: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Recipient name for a physical reward's shipping.",
        },
    )
        recipientName?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Contact phone for a physical reward's shipping.",
        },
    )
        phone?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Shipping address for a physical reward.",
        },
    )
        address?: string
}
