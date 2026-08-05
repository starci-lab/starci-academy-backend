import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator"

/** Upper bound on recipient name length, mirroring the `users.display_name` column. */
const MAX_RECIPIENT_NAME_LENGTH = 100
/** Upper bound on shipping phone length, mirroring the `consultants.phone_number` column. */
const MAX_PHONE_LENGTH = 32
/**
 * Upper bound on shipping address length. `reward_redemptions.metadata` (where this
 * snapshots) is jsonb with no per-field column bound; capped defensively at the
 * boundary the same way the only other free-text address column in the schema,
 * `headhunting_companies.address` (unbounded `text`), is treated app-side.
 */
const MAX_ADDRESS_LENGTH = 500

@InputType({
    description: "Redeem a reward from the gifts store.",
})
/**
 * Request to redeem a single catalog reward by its stable key. For PHYSICAL
 * rewards the shipping fields carry where to send the gift (snapshotted onto the
 * redemption's metadata for ops); they are ignored for digital rewards.
 */
export class RedeemRewardRequest {
    @Field(
        () => String,
        {
            description: "Stable catalog key of the reward to redeem (e.g. 'streakFreeze').",
        },
    )
    // required — an unknown key is rejected by the handler (UnknownRewardException)
    @IsString()
        rewardKey: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Recipient name for a physical reward's shipping.",
        },
    )
    // optional; ignored for digital rewards, capped when present
    @IsOptional()
    @IsString()
    @MaxLength(MAX_RECIPIENT_NAME_LENGTH)
        recipientName?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Contact phone for a physical reward's shipping.",
        },
    )
    // optional; ignored for digital rewards, capped when present
    @IsOptional()
    @IsString()
    @MaxLength(MAX_PHONE_LENGTH)
        phone?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Shipping address for a physical reward.",
        },
    )
    // optional; ignored for digital rewards, capped when present
    @IsOptional()
    @IsString()
    @MaxLength(MAX_ADDRESS_LENGTH)
        address?: string
}
