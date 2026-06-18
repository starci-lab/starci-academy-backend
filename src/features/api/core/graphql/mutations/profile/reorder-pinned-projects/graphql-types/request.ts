import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    ArrayMaxSize,
    IsArray,
    IsUUID,
} from "class-validator"

/** Upper bound on the number of pin ids accepted in one reorder request. */
const MAX_REORDER_IDS = 6

/**
 * Request to reorder the current user's pinned projects. The position of each
 * id in the array becomes its new `orderIndex` (0-based). Only ids that belong
 * to the user are affected; unknown / foreign ids are ignored.
 */
@InputType({
    description: "Request to reorder the user's pinned projects.",
})
export class ReorderPinnedProjectsRequest {
    @Field(
        () => [ID],
        {
            description: "Pin ids in the desired order; array position becomes orderIndex.",
        },
    )
    // bounded list of pin uuids; array order defines the new orderIndex values
    @IsArray()
    @ArrayMaxSize(MAX_REORDER_IDS)
    @IsUUID(undefined,
        {
            each: true,
        })
        ids: Array<string>
}
